BURADA KALDIMA GİT
import { DB } from './tools.db';
import { MainTools } from './tools.main';
import { ATEnvironmentDetail, ATEnvironmentType } from 'shared/models/at.environment';
import * as Promisers from 'shared/utilities/promisers';
import { join } from 'path';
import { compile as hbCompile } from 'handlebars';
import { ATSmartViewRequestOptions } from 'shared/models/at.smartview';
import { CheerioStatic } from 'cheerio';
import * as cheerio from 'cheerio';
import * as request from 'request';
import * as url from 'url';
import { ATStreamField } from 'shared/models/at.stream';

export class SmartViewTool {
	constructor( private db: DB, private tools: MainTools ) { }

	public readData = async ( payload: ATEnvironmentDetail ) => this.smartviewReadData( payload );
	private smartviewReadData = async ( payload: ATEnvironmentDetail ) => this.smartviewReadDataMDX( payload );
	private smartviewReadDataMDX = async ( payload: ATEnvironmentDetail ) => {
		// const body = await this.smartviewGetXMLTemplate( 'req_ExecuteQuery.xml', { SID: payload.SID } );
		throw new Error( 'Smart view read data MDX is not implemented yet' );
	}
	private smartviewGetXMLTemplate = async ( name: string, params: any ) => {
		const bodyXML = await Promisers.readFile( join( __dirname, './tools.smartview.templates/' + name ) );
		const bodyTemplate = hbCompile( bodyXML );
		return bodyTemplate( params );
	}
	private smartviewOpenCube = async ( payload: ATEnvironmentDetail ): Promise<ATEnvironmentDetail> => {
		await this.smartviewListCubes( payload );
		const body = await this.smartviewGetXMLTemplate( 'req_OpenCube.xml', payload );
		const { $ } = await this.smartviewPoster( { url: payload.smartview.planningurl, body, cookie: payload.smartview.cookies } );

		let isSuccessful = false;
		$( 'body' ).children().toArray().forEach( curElem => {
			if ( curElem.name === 'res_opencube' ) { isSuccessful = true; }
		} );
		if ( !isSuccessful ) throw ( new Error( 'Failure to open cube ' + payload.name + '@smartviewOpenCube' ) );
		return payload;
	}
	private smartviewListCubes = async ( payload: ATEnvironmentDetail ): Promise<ATEnvironmentDetail> => {
		await this.smartviewOpenApplication( payload );
		await this.smartviewGetAvailableServices( payload );
		await this.smartviewListDocuments( payload );
		const body = await this.smartviewGetXMLTemplate( 'req_ListCubes.xml', payload );
		const { $ } = await this.smartviewPoster( { url: payload.smartview.planningurl, body, cookie: payload.smartview.cookies } );

		let isSuccessful = false;
		$( 'body' ).children().toArray().forEach( curElem => {
			if ( curElem.name === 'res_listcubes' ) { isSuccessful = true; }
		} );
		if ( isSuccessful ) throw ( new Error( 'Failure to list cubes ' + payload.name + '@smartviewListCubes@issuccessful' ) );
		payload.smartview.cubes = $( 'cubes' ).text().split( '|' );
		return payload;
	}
	private smartviewOpenApplication = ( refObj: ATEnvironmentDetail ): Promise<ATEnvironmentDetail> => {
		let body: string;
		return this.smartviewListApplications( refObj )
			.then( resEnv => {
				refObj = resEnv;
				body = '<req_OpenApplication><sID>' + refObj.SID + '</sID><srv>' + refObj.planningserver + '</srv><app>' + refObj.database + '</app><type></type><url></url></req_OpenApplication>';
				return this.smartviewPoster( { url: refObj.planningurl, body, cookie: refObj.cookies } );
			} )
			.then( response => {
				let isSuccessful = false;
				response.$( 'body' ).children().toArray().forEach( curElem => {
					if ( curElem.name === 'res_openapplication' ) { isSuccessful = true; }
				} );
				if ( isSuccessful ) {
					return Promise.resolve( refObj );
				} else {
					return Promise.reject( new Error( 'Failure to open application ' + refObj.name + '@smartviewOpenApplication' ) );
				}
			} );
	}
	public smartviewListApplications = ( payload: ATEnvironmentDetail ): Promise<ATEnvironmentDetail> => {
		// Validate SID function tries the smartviewListApplicationsValidator
		// If successful we have the applications listed in the response already
		// We made this so that we can avoid the circular reference
		return this.validateSID( payload );
	}
	public validateSID = ( refObj: ATEnvironmentDetail ): Promise<ATEnvironmentDetail> => {
		return new Promise( ( resolve, reject ) => {
			if ( refObj.SID ) {
				delete refObj.SID;
				delete refObj.cookies;
				resolve( this.validateSID( refObj ) );
			} else {
				switch ( refObj.type ) {
					case ATEnvironmentType.PBCS: {
						// resolve( this.pbcsObtainSID( refObj ).then( this.smartviewListApplicationsValidator ) );
						this.pbcsObtainSID( refObj ).then( this.smartviewListApplicationsValidator ).then( resolve ).catch( reject );
						break;
					}
					case ATEnvironmentType.HP: {
						this.hpObtainSID( refObj ).then( this.smartviewListApplicationsValidator ).then( resolve ).catch( reject );
						break;
					}
					default: {
						reject( new Error( 'Not a valid environment type' ) );
					}
				}
			}
		} );
	}
	public smartviewReadDataPrepare = async ( payload ) => {
		await this.smartviewOpenCube( payload );

		payload.query.hierarchies = await this.smartviewGetAllDescriptionsWithHierarchy( payload, Object.values( <DimeStreamFieldDetail[]>payload.query.dimensions ).sort( SortByPosition ) );
		payload.query.povMembers = payload.query.povs.map( ( pov, pindex ) => findMembers( payload.query.hierarchies[payload.query.povDims[pindex]], pov.selectionType, pov.selectedMember ) );

		const colCartesian = payload.query.cols.map( col => {
			return arrayCartesian( col.map( ( selection, sindex ) => {
				return findMembers( payload.query.hierarchies[payload.query.colDims[sindex]], selection.selectionType, selection.selectedMember );
			} ) );
		} );
		payload.query.colMembers = [];
		colCartesian.forEach( cm => {
			payload.query.colMembers = payload.query.colMembers.concat( cm );
		} );

		payload.query.memberCounts = <any>{};
		payload.query.memberCounts.povs = 1;
		payload.query.memberCounts.rows = [];
		payload.query.memberCounts.cols = [];
		payload.query.povs.forEach( ( pov, index ) => {
			pov.memberList = findMembers( payload.query.hierarchies[payload.query.povDims[index]], pov.selectionType, pov.selectedMember );
			pov.memberCount = pov.memberList.length;
			payload.query.memberCounts.povs *= pov.memberCount;
		} );
		payload.query.rows.forEach( ( row, index ) => {
			let rowCount = 1;
			row.forEach( ( selection, dimindex ) => {
				selection.memberList = findMembers( payload.query.hierarchies[payload.query.rowDims[dimindex]], selection.selectionType, selection.selectedMember );
				selection.memberCount = selection.memberList.length;
				rowCount *= selection.memberCount;
			} );
			payload.query.memberCounts.rows.push( rowCount );
		} );
		payload.query.cols.forEach( ( col, index ) => {
			let colCount = 1;
			col.forEach( ( selection, dimindex ) => {
				selection.memberList = findMembers( payload.query.hierarchies[payload.query.colDims[dimindex]], selection.selectionType, selection.selectedMember );
				selection.memberCount = selection.memberList.length;
				colCount *= selection.memberCount;
			} );
			payload.query.memberCounts.cols.push( colCount );
		} );

		payload.query.memberCounts.totalRowIntersections = payload.query.memberCounts.rows.reduce( ( accumulator, currentValue ) => accumulator + currentValue );
		payload.query.memberCounts.totalColIntersections = payload.query.memberCounts.cols.reduce( ( accumulator, currentValue ) => accumulator + currentValue );

		payload.pullLimit = 100000;
		payload.pullThreadNumber = 8;
		payload.pullThreadPool = []; for ( let x = 0; x < payload.pullThreadNumber; x++ ) payload.pullThreadPool[x] = 0;

		if ( payload.query.memberCounts.totalColIntersections > payload.pullLimit ) {
			return Promise.reject( new Error( 'Too many intersections on the column (' + payload.query.memberCounts.totalColIntersections + '). Limit is ' + payload.pullLimit ) );
		}
		payload.rowsPerChunck = Math.floor( payload.pullLimit / payload.query.memberCounts.totalColIntersections );

		payload.data = [];

		payload.numberOfChuncks = Math.ceil( payload.query.memberCounts.totalRowIntersections / payload.rowsPerChunck );

		const numberOfRowDimensions = payload.query.rowDims.length;
		const chunck: string[][] = [];

		let whichChunck = 0;
		// let whichRow = 0;

		for ( const row of payload.query.rows ) {
			payload.currentRowIntersection = payload.query.rowDims.map( r => 0 );
			payload.currentRowIntersectionLimits = row.map( r => r.memberCount );
			let keepWorking = true;

			while ( keepWorking ) {
				chunck.push( payload.currentRowIntersection.map( ( index, dimindex ) => row[dimindex].memberList[index].RefField ) );
				if ( chunck.length === payload.rowsPerChunck ) {
					const threadToAssign = await this.waitForEmptyThread( payload.pullThreadPool );
					payload.pullThreadPool[threadToAssign] = 1;
					this.smartviewReadDataPullChunck( threadToAssign, payload, chunck.splice( 0 ), 0, ++whichChunck )
						.then( threadToRelease => payload.pullThreadPool[threadToRelease] = 0 )
						.catch( issue => payload.pullThreadPool[threadToAssign] = 0 );
				}

				let currentIndex = numberOfRowDimensions - 1;
				while ( currentIndex >= 0 ) {
					payload.currentRowIntersection[currentIndex] = ( payload.currentRowIntersection[currentIndex] + 1 ) % payload.currentRowIntersectionLimits[currentIndex];
					if ( payload.currentRowIntersection[currentIndex] === 0 ) {
						currentIndex--;
					} else {
						currentIndex = -1;
					}
				}
				if ( payload.currentRowIntersection.reduce( ( accumulator, currentValue ) => accumulator + currentValue ) === 0 ) keepWorking = false;

				// await waiter( 5000 );
				// if ( whichChunck > 100 ) keepWorking = false;
			}
		}

		if ( chunck.length > 0 ) {
			const threadFinal = await this.waitForEmptyThread( payload.pullThreadPool );
			payload.pullThreadPool[threadFinal] = 1;
			this.smartviewReadDataPullChunck( threadFinal, payload, chunck.splice( 0 ), 0, ++whichChunck )
				.then( threadToRelease => payload.pullThreadPool[threadToRelease] = 0 )
				.catch( issue => payload.pullThreadPool[threadFinal] = 0 );
		}

		await this.waitForAllThreadsCompletion( payload.pullThreadPool );

		// return Promise.reject( new Error( 'Not yet' ) );
		// return payload;
	}
	private smartviewReadDataPullChunck = ( thread: number, payload, chunck, retrycount = 0, whichChunck: number ): Promise<number> => {
		const maxRetry = 10;
		return new Promise( ( resolve, reject ) => {
			this.smartviewReadDataPullChunckAction( payload, chunck, whichChunck ).then( () => resolve( thread ) ).catch( issue => {
				if ( retrycount < maxRetry ) {
					retrycount++;
					console.log( '?????', payload.pullThreadPool.join( '' ), thread, retrycount, maxRetry, 'Chunck Length:', chunck.length, issue );
					// payload.pullThreadPool[thread]++;
					resolve( this.smartviewReadDataPullChunck( thread, payload, chunck, retrycount, whichChunck ) );
				} else {
					reject( issue );
				}
			} );
		} );
	}
	private smartviewReadDataPullChunckAction = async ( payload, chunck: any[], whichChunck: number ) => {
		const startTime = new Date();

		let valueArray = [];
		let typeArray = [];

		payload.query.colDims.forEach( ( colDim, colDimIndex ) => {
			payload.query.rowDims.forEach( ( rowDim, rowDimIndex ) => {
				valueArray.push( '' );
				typeArray.push( '7' );
			} );
			payload.query.colMembers.forEach( colMember => {
				valueArray.push( colMember[colDimIndex].RefField );
				typeArray.push( '0' );
			} );
		} );
		chunck.forEach( ( rowMemberList, rowMemberIndex ) => {
			rowMemberList.forEach( rowMember => {
				valueArray.push( rowMember );
				typeArray.push( 0 );
			} );
			payload.query.colMembers.forEach( colMember => {
				valueArray.push( '' );
				typeArray.push( '2' );
			} );
		} );

		const params: any = {};
		params.SID = payload.SID;
		params.cube = payload.table;
		params.rows = payload.query.colDims.length + chunck.length;
		params.cols = payload.query.rowDims.length + payload.query.colMembers.length;
		params.range = { start: 0, end: ( ( payload.query.colDims.length + chunck.length ) * ( payload.query.rowDims.length + payload.query.colMembers.length ) - 1 ) };
		params.povDims = payload.query.povDims.map( ( cd, index ) => ( { refreshid: index, name: payload.query.dimensions[cd].name, memberName: payload.query.povs[index].memberList[0].RefField } ) );
		params.rowDims = payload.query.rowDims.map( ( cd, index ) => ( { refreshid: index + payload.query.povDims.length, name: payload.query.dimensions[cd].name, roworder: index } ) );
		params.colDims = payload.query.colDims.map( ( cd, index ) => ( { refreshid: index + payload.query.povDims.length + payload.query.rowDims.length, name: payload.query.dimensions[cd].name, colorder: index } ) );
		params.vals = valueArray.join( '|' );
		params.types = typeArray.join( '|' );

		// Clean up some unused variables
		chunck = [];
		valueArray = [];
		typeArray = [];

		const bodyXML = await Promisers.readFile( path.join( __dirname, './tools.smartview.assets/req_Refresh.xml' ) );
		const bodyTemplate = Handlebars.compile( bodyXML );
		const body = bodyTemplate( params );

		console.log( '>>>', payload.pullThreadPool.join( '' ), 'Pulling chunck', whichChunck, '/', payload.numberOfChuncks, 'posted.' );
		const response = await this.smartviewPoster( { url: payload.planningurl, body, cookie: payload.cookies, timeout: 120000000 } );

		const doWeHaveData = response.$( 'body' ).children().toArray().filter( elem => ( elem.name === 'res_refresh' ) ).length > 0;
		const totalTime = ( ( new Date() ).getTime() - startTime.getTime() ) / 1000;
		console.log( '>>>', payload.pullThreadPool.join( '' ), 'Pulling chunck', whichChunck, '/', payload.numberOfChuncks, 'received. WithData:', doWeHaveData, '-', totalTime, 'secs' );
		if ( doWeHaveData ) {
			const rangeStart = parseInt( response.$( 'range' ).attr( 'start' ), 10 );
			const rangeEnd = parseInt( response.$( 'range' ).attr( 'end' ), 10 );
			const cellsToSkip = payload.query.colDims.length * ( payload.query.rowDims.length + payload.query.colMembers.length ) - rangeStart;
			const vals: string[] = response.$( 'vals' ).text().split( '|' ).splice( cellsToSkip );
			const stts: string[] = response.$( 'status' ).text().split( '|' ).splice( cellsToSkip );
			const typs: string[] = response.$( 'types' ).text().split( '|' ).splice( cellsToSkip );
			while ( vals.length > 0 ) {
				payload.data.push( vals.splice( 0, payload.query.rowDims.length + payload.query.colMembers.length ) );
			}
			return Promise.resolve( payload );
		} else {
			if ( response.body.indexOf( 'there are no valid rows of data' ) >= 0 ) {
				return Promise.resolve( payload );
			} else {
				console.log( response.body );
				return Promise.reject( new Error( response.$( 'desc' ).text() ) );
			}
		}
	}
	private waitForAllThreadsCompletion = ( list: number[] ): Promise<boolean> => {
		return new Promise( ( resolve, reject ) => {
			const toClear = setInterval( () => {
				console.log( 'Waiting for All threads completion:', list.join( '' ) );
				if ( list.filter( i => i > 0 ).length === 0 ) {
					resolve();
					clearInterval( toClear );
				}
			}, 1000 );
		} );
	}
	private waitForEmptyThread = ( list: number[] ): Promise<number> => {
		return new Promise( ( resolve, reject ) => {
			let foundIndex = list.findIndex( i => i === 0 );
			if ( foundIndex >= 0 ) {
				resolve( foundIndex );
			} else {
				const toClear = setInterval( () => {
					foundIndex = list.findIndex( i => i === 0 );
					if ( foundIndex >= 0 ) {
						resolve( foundIndex );
						clearInterval( toClear );
					}
				}, 2000 );
			}
		} );
	}
	private smartviewReadDataOLD = ( payload ) => {
		return new Promise( ( resolve, reject ) => {
			payload.dims = _.keyBy( payload.query.dims, 'id' );
			payload.pullLimit = 10000000;
			payload.data = [];
			payload.startTime = new Date();
			payload.numberofRowsPerChunck = Math.floor( payload.pullLimit / payload.query.colMembers.length );
			if ( payload.numberofRowsPerChunck < 1 ) {
				payload.numberofRowsPerChunck = 1;
			}
			payload.numberOfChuncks = Math.ceil( payload.query.rowMembers.length / payload.numberofRowsPerChunck );
			this.smartviewReadDataPullChuncks( payload ).then( resolve ).catch( reject );
		} );
	}
	private smartviewReadDataPullChuncks = ( payload ) => {
		console.log( '>>> Pulling chunck', ( payload.consumedChuncks + 1 ), '/', payload.numberOfChuncks );
		const startTime = new Date();
		return new Promise( ( resolve, reject ) => {
			if ( payload.query.rowMembers.length < 1 ) {
				resolve( payload );
			} else {
				const chunck = payload.query.rowMembers.splice( 0, payload.numberofRowsPerChunck );
				this.smartviewReadDataPullChuncksTry( payload, chunck ).then( result => {
					payload.consumedChuncks++;
					const finishTime = new Date();
					console.log( '>>> Pulling chunck', payload.consumedChuncks, '/', payload.numberOfChuncks, 'finished. Duration:', ( finishTime.getTime() - startTime.getTime() ) / 1000 );
					resolve( this.smartviewReadDataPullChuncks( payload ) );
				} ).catch( reject );
			}
		} );
	}
	private smartviewReadDataPullChuncksTry = ( payload, chunck: any[], retrycount = 0 ) => {
		const maxRetry = 10;
		return new Promise( ( resolve, reject ) => {
			this.smartviewReadDataPullChuncksAction( payload, chunck ).then( resolve ).catch( issue => {
				if ( retrycount < maxRetry ) {
					resolve( this.smartviewReadDataPullChuncksTry( payload, chunck, ++retrycount ) );
				} else {
					reject( issue );
				}
			} );
		} );
	}
	private smartviewReadDataPullChuncksAction = ( payload, chunck: any[] ) => {
		let body = '';
		const startTime = new Date();
		return this.smartviewOpenCube( payload )
			.then( resEnv => {
				body += '<req_Refresh>';
				body += '<sID>' + resEnv.SID + '</sID>';
				body += '<preferences>';
				body += '<row_suppression zero="1" invalid="0" missing="1" underscore="0" noaccess="0"/>';
				body += '<celltext val="1"/>';
				body += '<zoomin ancestor="bottom" mode="children"/>';
				body += '<navigate withData="1"/>';
				body += '<includeSelection val="1"/>';
				body += '<repeatMemberLabels val="1"/>';
				body += '<withinSelectedGroup val="0"/>';
				body += '<removeUnSelectedGroup val="0"/>';
				body += '<col_suppression zero="0" invalid="0" missing="0" underscore="0" noaccess="0"/>';
				body += '<block_suppression missing="1"/>';
				body += '<includeDescriptionInLabel val="2"/>';
				body += '<missingLabelText val=""/>';
				body += '<noAccessText val="#No Access"/>';
				body += '<aliasTableName val="none"/>';
				body += '<essIndent val="2"/>';
				body += '<FormatSetting val="2"/>';
				body += '<sliceLimitation rows="1048576" cols="16384"/>';
				body += '</preferences>';
				body += '<grid>';
				body += '<cube>' + resEnv.table + '</cube>';
				body += '<dims>';
				let currentID = 0;
				payload.query.povDims.forEach( ( dim, dimindex ) => {
					const memberName = payload.query.povMembers[dimindex][0].RefField;
					body += '<dim id="' + currentID + '" name="' + payload.dims[dim].name + '" pov="' + memberName + '" display="' + memberName + '" hidden="0" expand="0"/>';
					currentID++;
				} );
				payload.query.rowDims.forEach( ( dim, dimindex ) => {
					body += '<dim id="' + currentID + '" name="' + payload.dims[dim].name + '" row="' + dimindex + '" hidden="0" expand="0"/>';
					currentID++;
				} );
				payload.query.colDims.forEach( ( dim, dimindex ) => {
					body += '<dim id="' + currentID + '" name="' + payload.dims[dim].name + '" col="' + dimindex + '" hidden="0" expand="0"/>';
					currentID++;
				} );
				body += '</dims>';
				body += '<perspective type="Reality"/>';
				body += '<slices>';
				body += '<slice rows="' + ( payload.query.colDims.length + chunck.length ) + '" cols="' + ( payload.query.rowDims.length + payload.query.colMembers.length ) + '">';
				body += '<data>';
				body += '<range start="0" end="' + ( ( payload.query.colDims.length + chunck.length ) * ( payload.query.rowDims.length + payload.query.colMembers.length ) - 1 ) + '">';
				const valueArray = [];
				const typeArray = [];
				payload.query.colDims.forEach( ( colDim, colDimIndex ) => {
					payload.query.rowDims.forEach( ( rowDim, rowDimIndex ) => {
						valueArray.push( '' );
						typeArray.push( '7' );
					} );
					payload.query.colMembers.forEach( colMember => {
						// console.log( '***', colMember );
						valueArray.push( colMember[colDimIndex].RefField );
						typeArray.push( '0' );
					} );
				} );
				chunck.forEach( ( rowMemberList, rowMemberIndex ) => {
					rowMemberList.forEach( rowMember => {
						valueArray.push( rowMember.RefField );
						typeArray.push( 0 );
					} );
					payload.query.colMembers.forEach( colMember => {
						valueArray.push( '' );
						typeArray.push( '2' );
					} );
					// console.log( rowMemberIndex, rowMemberList );
				} );
				// console.log( valueArray.join( '|' ) );
				// console.log( typeArray.join( '|' ) );
				body += '<vals>' + valueArray.join( '|' ) + '</vals>';
				body += '<types>' + typeArray.join( '|' ) + '</types>';
				body += '</range>';
				body += '</data>';
				body += '<metadata/>';
				body += '<conditionalFormats/>';
				body += '</slice>';
				body += '</slices>';
				body += '</grid>';
				body += '</req_Refresh>';
				console.log( '>>> Pulling chunck', ( payload.consumedChuncks + 1 ), '/', payload.numberOfChuncks, 'posted.' );
				return this.smartviewPoster( { url: resEnv.planningurl, body, cookie: resEnv.cookies, timeout: 120000000 } );
				// return Promise.reject( 'Trying something' );
			} )
			.then( response => {
				console.log( '>>> Pulling chunck', ( payload.consumedChuncks + 1 ), '/', payload.numberOfChuncks, 'received.' );
				const doWeHaveData = response.$( 'body' ).children().toArray().filter( elem => ( elem.name === 'res_refresh' ) ).length > 0;
				console.log( '>>>>>>>>>>>Do We Have Data:', doWeHaveData, '>>>>>>>>>>>Duration Passed:', ( ( new Date() ).getTime() - startTime.getTime() ) / 1000, 'seconds' );
				if ( doWeHaveData ) {
					const rangeStart = parseInt( response.$( 'range' ).attr( 'start' ), 10 );
					const rangeEnd = parseInt( response.$( 'range' ).attr( 'end' ), 10 );
					const cellsToSkip = payload.query.colDims.length * ( payload.query.rowDims.length + payload.query.colMembers.length ) - rangeStart;
					const vals: string[] = response.$( 'vals' ).text().split( '|' ).splice( cellsToSkip );
					const stts: string[] = response.$( 'status' ).text().split( '|' ).splice( cellsToSkip );
					const typs: string[] = response.$( 'types' ).text().split( '|' ).splice( cellsToSkip );
					while ( vals.length > 0 ) {
						payload.data.push( vals.splice( 0, payload.query.rowDims.length + payload.query.colMembers.length ) );
					}
					return Promise.resolve( payload );
				} else {
					const errcode = response.$( 'exception' ).attr( 'errcode' );
					if ( errcode === '1000' ) {
						return Promise.resolve( payload );
					} else {
						console.log( response.body );
						return Promise.reject( new Error( response.$( 'desc' ).text() ) );
					}
				}
			} ).catch( issue => {
				console.log( issue );
				console.log( 'Time to failure:', ( ( new Date() ).getTime() - startTime.getTime() ) / 1000, 'seconds' );
				return Promise.reject( issue );
			} );
	}
	public runBusinessRule = ( payload ) => {
		return this.smartviewRunBusinessRule( payload );
	}
	private smartviewRunBusinessRule = ( payload, retrycount = 0 ) => {
		const maxRetry = 10;
		return new Promise( ( resolve, reject ) => {
			this.smartviewRunBusinessRuleAction( payload ).then( resolve ).catch( issue => {
				if ( retrycount < maxRetry ) {
					resolve( this.smartviewRunBusinessRule( payload, ++retrycount ) );
				} else {
					reject( issue );
				}
			} );
		} );
	}
	private smartviewRunBusinessRuleAction = ( payload ): Promise<any> => {
		let body = '';
		return this.smartviewOpenCube( payload ).then( resEnv => {
			body += '<req_LaunchBusinessRule>';
			body += '<sID>' + resEnv.SID + '</sID>';
			body += '<cube>' + resEnv.table + '</cube>';
			body += '<rule type="' + resEnv.procedure.type + '">' + resEnv.procedure.name + '</rule>';
			body += '<prompts>';
			resEnv.procedure.variables.forEach( ( curRTP: any ) => {
				body += '<rtp>';
				body += '<name>' + curRTP.name + '</name>';
				body += '<val>' + curRTP.value + '</val>';
				body += '</rtp>';
			} );
			body += '</prompts>';
			body += '<ODL_ECID>0000</ODL_ECID>';
			body += '</req_LaunchBusinessRule>';
			return this.smartviewPoster( { url: resEnv.planningurl, body, cookie: resEnv.cookies } );
		} ).then( response => {
			const isSuccessful = response.$( 'body' ).children().toArray().filter( elem => ( elem.name === 'res_launchbusinessrule' ) ).length > 0;
			if ( isSuccessful ) {
				return Promise.resolve();
			} else {
				return Promise.reject( new Error( 'There is an issue with running business rule ' + response.body ) );
			}
		} );
	}
	public writeData = ( payload ) => {
		return this.smartviewWriteData( payload );
	}
	private smartviewWriteData = ( payload ) => {
		return new Promise( ( resolve, reject ) => {
			payload.issueList = [];
			payload.cellsTotalCount = 0;
			payload.cellsValidCount = 0;
			payload.cellsInvalidCount = 0;
			const pushLimit = 5000;
			const wholeData = payload.data;
			let numberofRowsPerChunck = Math.floor( pushLimit / ( Object.keys( wholeData[0] ).length - payload.sparseDims.length ) );
			if ( numberofRowsPerChunck < 1 ) {
				numberofRowsPerChunck = 1;
			}
			const chunkedData: any[] = [];
			while ( wholeData.length > 0 ) {
				chunkedData.push( wholeData.splice( 0, numberofRowsPerChunck ) );
			}
			this.smartviewWriteDataSendChuncks( payload, chunkedData ).then( () => { resolve( payload ); } ).catch( reject );
		} );
	}
	private smartviewWriteDataSendChuncks = ( payload, chunks: any[] ) => {
		return new Promise( ( resolve, reject ) => {
			asynclib.eachOfSeries( chunks, ( chunk, key, callback ) => {
				payload.data = chunk;
				this.smartviewWriteDataTry( payload, 0 ).then( result => { callback(); } ).catch( callback );
			}, ( err ) => {
				if ( err ) {
					reject( err );
				} else {
					resolve();
				}
			} );
		} );
	}
	private smartviewWriteDataTry = ( payload, retrycount = 0 ) => {
		const maxRetry = 10;
		return new Promise( ( resolve, reject ) => {
			this.smartviewWriteDataAction( payload ).then( resolve ).catch( issue => {
				if ( retrycount < maxRetry ) {
					resolve( this.smartviewWriteDataTry( payload, ++retrycount ) );
				} else {
					reject( issue );
				}
			} );
		} );
	}
	private smartviewWriteDataAction = ( payload ) => {
		let body = '';
		return this.smartviewOpenCube( payload ).then( resEnv => {
			body += '<req_WriteBack>';
			body += '<sID>' + resEnv.SID + '</sID>';
			body += '<preferences />';
			body += '<grid>';
			body += '<cube>' + resEnv.table + '</cube>';
			body += '<dims>';
			payload.sparseDims.forEach( function ( curDim: string, curKey: number ) {
				body += '<dim id="' + curKey + '" name="' + curDim + '" row="' + curKey + '" hidden="0" />';
			} );
			body += '<dim id="' + payload.sparseDims.length + '" name="' + payload.denseDim + '" col="0" hidden="0" />';
			body += '</dims>';
			body += '<slices>';
			body += '<slice rows="' + ( payload.data.length + 1 ) + '" cols="' + Object.keys( payload.data[0] ).length + '">';
			body += '<data>';
			const dirtyCells: any[] = [];
			const vals: any[] = [];
			const typs: any[] = [];
			const stts: any[] = [];
			const rowHeaders: { type: string, name: string }[] = [];
			const colHeaders: { type: string, name: string }[] = [];
			const headerTuple = JSON.parse( JSON.stringify( payload.data[0] ) );
			payload.sparseDims.forEach( dimensionName => {
				rowHeaders.push( { type: 'sparse', name: dimensionName } );
				delete headerTuple[dimensionName];
			} );
			Object.keys( headerTuple ).forEach( denseMemberName => {
				colHeaders.push( { type: 'dense', name: denseMemberName } );
			} );

			let i = 0;

			colHeaders.sort( SortByName );
			rowHeaders.forEach( rowHeader => {
				vals.push( '' );
				typs.push( '7' );
				stts.push( '' );
				dirtyCells.push( '' );
				i++;
			} );
			colHeaders.forEach( colHeader => {
				vals.push( colHeader.name );
				typs.push( '0' );
				stts.push( '0' );
				dirtyCells.push( '' );
				i++;
			} );
			payload.data.forEach( ( curTuple: any ) => {
				rowHeaders.forEach( rowHeader => {
					vals.push( curTuple[rowHeader.name].toString() );
					typs.push( '0' );
					stts.push( '0' );
					dirtyCells.push( '' );
					i++;
				} );
				colHeaders.forEach( colHeader => {
					typs.push( '2' );
					if ( curTuple[colHeader.name] ) {
						stts.push( '258' );
						vals.push( parseFloat( curTuple[colHeader.name] ).toString() );
						dirtyCells.push( i.toString( 10 ) );
					} else {
						stts.push( '8193' );
						vals.push( '' );
						dirtyCells.push( '' );
					}
					i++;
				} );
			} );
			const rangeEnd = ( payload.data.length + 1 ) * Object.keys( payload.data[0] ).length;
			body += '<dirtyCells>' + encodeXML( dirtyCells.join( '|' ) ) + '</dirtyCells>';
			body += '<range start="0" end="' + ( rangeEnd - 1 ) + '">';
			body += '<vals>' + encodeXML( vals.join( '|' ) ) + '</vals>';
			body += '<types>' + encodeXML( typs.join( '|' ) ) + '</types>';
			body += '<status enc="0">' + stts.join( '|' ) + '</status>';
			body += '</range>';
			body += '</data>';
			body += '</slice>';
			body += '</slices>';
			body += '</grid>';
			body += '</req_WriteBack>';
			return this.smartviewPoster( { url: resEnv.planningurl, body, cookie: resEnv.cookies } );
		} ).then( response => {
			const rangeStart = parseInt( response.$( 'range' ).attr( 'start' ), 10 );
			const rangeEnd = parseInt( response.$( 'range' ).attr( 'end' ), 10 );
			const vals = response.$( 'vals' ).text().split( '|' );
			const stts = response.$( 'status' ).text().split( '|' );
			const headers = Object.keys( payload.data[0] );
			const cellsToSkip = headers.length - rangeStart;
			vals.splice( 0, cellsToSkip );
			stts.splice( 0, cellsToSkip );
			const results: any[] = [];
			while ( vals.length > 0 ) {
				const sparsePart: any = {};
				// Prepare the sparse part
				headers.forEach( ( header, index ) => {
					if ( index < payload.sparseDims.length ) {
						sparsePart[vals.splice( 0, 1 )[0]] = stts.splice( 0, 1 )[0];
					}
				} );

				headers.forEach( ( header, index ) => {
					if ( index >= payload.sparseDims.length ) {
						const result = JSON.parse( JSON.stringify( sparsePart ) );
						result[header] = vals.splice( 0, 1 )[0];
						result.writestatus = stts.splice( 0, 1 )[0];
						results.push( result );
					}
				} );

			}
			results.forEach( result => {
				result.finalStatus = '';
				if ( result.writestatus !== '8194' && result.writestatus !== '2' ) {
					result.finalStatus = 'Target is not valid: ' + result.writestatus;
				}
				payload.cellsTotalCount++;
				if ( result.finalStatus !== '' ) {
					payload.cellsInvalidCount++;
					payload.issueList.push( Object.keys( result ).filter( ( element, index ) => index <= payload.sparseDims.length ).join( '|' ) + ' => ' + result.finalStatus );
				} else {
					payload.cellsValidCount++;
				}
			} );
			const isSuccessful = response.$( 'body' ).children().toArray().filter( elem => ( elem.name === 'res_writeback' ) ).length > 0;
			if ( isSuccessful ) {
				return Promise.resolve( 'Data is pushed to Hyperion Planning' );
			} else {
				return Promise.reject( new Error( 'Failed to write data:' + response.body ) );
			}
		} );
	}
	public listBusinessRuleDetails = ( environment: ATEnvironmentDetail ) => {
		return this.smartviewListBusinessRuleDetails( environment );
	}
	private smartviewListBusinessRuleDetails = ( environment: ATEnvironmentDetail ) => {
		return this.smartviewOpenCube( environment )
			.then( resEnv => {
				// tslint:disable-next-line:max-line-length
				const body = '<req_EnumRunTimePrompts><sID>' + resEnv.SID + '</sID><cube>' + resEnv.table + '</cube ><rule type="' + resEnv.procedure.type + '">' + resEnv.procedure.name + '</rule><ODL_ECID>0000</ODL_ECID></req_EnumRunTimePrompts>';
				return this.smartviewPoster( { url: resEnv.planningurl, body, cookie: resEnv.cookies } );
			} )
			.then( response => {
				const rtps: any[] = [];
				response.$( 'rtp' ).toArray().forEach( rtp => {
					const toPush: any = {};
					toPush.name = response.$( rtp ).find( 'name' ).text();
					toPush.description = response.$( rtp ).find( 'description' ).text();
					toPush.dimension = response.$( rtp ).find( 'member' ).toArray()[0].attribs.dim;
					toPush.memberselect = response.$( rtp ).find( 'member' ).toArray()[0].attribs.mbrselect;
					if ( toPush.memberselect === '0' ) {
						toPush.memberselect = false;
					} else {
						toPush.memberselect = true;
					}
					toPush.choice = response.$( rtp ).find( 'member' ).toArray()[0].attribs.choice;
					toPush.defaultmember = response.$( rtp ).find( 'member' ).find( 'default' ).text();
					toPush.allowmissing = response.$( rtp ).find( 'allowMissing' ).text();
					rtps.push( toPush );
				} );
				return Promise.resolve( rtps );
			} );
	}
	public listBusinessRules = ( environment: ATEnvironmentDetail ) => {
		return this.smartviewListBusinessRules( environment );
	}
	private smartviewListBusinessRules = ( payload: ATEnvironmentDetail ) => {
		burada kaldım
		return this.smartviewOpenCube( payload )
			.then( resEnv => {
				const body = '<req_EnumBusinessRules><sID>' + resEnv.SID + '</sID><cube>' + resEnv.table + '</cube><runOnSave>0</runOnSave><ODL_ECID>0000</ODL_ECID></req_EnumBusinessRules>';
				return this.smartviewPoster( { url: resEnv.smartview.planningurl, body, cookie: resEnv.smartview.cookies } );
			} )
			.then( response => {
				const isSuccessful = response.$( 'body' ).children().toArray().filter( elem => ( elem.name === 'res_enumbusinessrules' ) ).length > 0;
				if ( isSuccessful ) {
					const ruleList: any[] = response.$( 'rule' ).toArray().map( rule => ( { name: response.$( rule ).text(), hasRTP: rule.attribs.rtp, type: rule.attribs.type } ) );
					return Promise.resolve( ruleList );
				} else {
					return Promise.reject( new Error( 'Failure to list business rules ' + payload.name + '@smartviewListBusinessRules' ) );
				}
			} );
	}
	public getDescriptionsWithHierarchy = ( refObj: ATEnvironmentDetail, refField: ATStreamField ) => {
		return this.smartviewGetDescriptionsWithHierarchy( refObj, refField ).then( result => result.smartview.memberList );
	}
	private smartviewGetDescriptionsWithHierarchy = ( refObj: ATEnvironmentDetail, refField: ATStreamField ): Promise<ATEnvironmentDetail> => {
		return this.smartviewListAliasTables( refObj )
			.then( resEnv => { refObj = resEnv; return this.smartviewOpenDimension( refObj, refField ); } )
			.then( resEnv => { refObj = resEnv; return this.smartviewGetDescriptionsWithHierarchyAction( refObj, refField ); } );
	}
	public smartviewGetAllDescriptionsWithHierarchy = async ( refObj: ATEnvironmentDetail, refFields: ATStreamField[] ) => {
		const toReturn: any = {};
		await Promise.all( refFields.map( async ( field ) => this.smartviewGetAllDescriptionsWithHierarchyAction( refObj, field, toReturn ) ) );
		return toReturn;
	}
	private smartviewGetAllDescriptionsWithHierarchyAction = ( payload, field, toReturn ) => {
		const sourceEnvironment = JSON.parse( JSON.stringify( payload ) );
		return new Promise( ( resolve, reject ) => {
			this.smartviewGetDescriptionsWithHierarchy( sourceEnvironment, field ).then( result => {
				toReturn[field.id] = result.smartview.memberList;
				resolve();
			} ).catch( reject );
		} );
	}
	private smartviewGetDescriptionsWithHierarchyAction = async ( payload: ATEnvironmentDetail, field: ATStreamField ): Promise<ATEnvironmentDetail> => {
		const numberofColumns = 4; // Because columns are membername, description, desired aliastable name and parent
		const body = await this.smartviewGetXMLTemplate( 'req_ExecuteGridforDescriptionsWithHierarchy.xml', {
			SID: payload.SID,
			table: payload.table,
			numberofColumns,
			rangeend: ( numberofColumns * 2 - 1 ),
			descriptiveTable: field.description.table,
			name: field.name
		} );
		const { $ } = await this.smartviewPoster( { url: payload.smartview.planningurl, body, cookie: payload.smartview.cookies } );

		let isSuccessful = false;
		$( 'body' ).children().toArray().forEach( curElem => {
			if ( curElem.name === 'res_executegrid' ) { isSuccessful = true; }
		} );

		const rangeStart = parseInt( $( 'range' ).attr( 'start' ), 10 );

		if ( !isSuccessful ) {
			throw ( new Error( 'Failure to get descriptions ' + payload.name + '@smartviewGetDescriptionsAction' ) );
		} else if ( rangeStart > 1 ) {
			throw ( new Error( 'Failure to get descriptions, wrong number returned for rangeStart ' + payload.name + '@smartviewGetDescriptionsAction' ) );
		}

		const vals = $( 'vals' ).text().split( '|' );
		vals.splice( 0, ( numberofColumns - rangeStart ) );
		payload.smartview.memberList = [];
		while ( vals.length ) {
			const curMemberArray = vals.splice( 0, numberofColumns );
			const curMember: { RefField: string, Description: string, Parent: string } = { RefField: curMemberArray[0], Description: curMemberArray[numberofColumns - 1], Parent: curMemberArray[2] };
			if ( !curMember.Description ) { curMember.Description = curMemberArray[1]; }
			if ( !curMember.Description ) { curMember.Description = curMemberArray[0]; }
			payload.smartview.memberList.push( curMember );
		}
		return payload;
	}
	public getDescriptions = async ( payload: ATEnvironmentDetail, field: ATStreamField ) => {
		await this.smartviewGetDescriptions( payload, field );
		return payload.smartview.memberList;
	}
	private smartviewGetDescriptions = async ( payload: ATEnvironmentDetail, field: ATStreamField ): Promise<ATEnvironmentDetail> => {
		await this.smartviewListAliasTables( payload );
		await this.smartviewOpenDimension( payload, field );
		await this.smartviewGetDescriptionsAction( payload, field );
		return payload;
	}
	private smartviewOpenDimension = async ( payload: ATEnvironmentDetail, field: ATStreamField ): Promise<ATEnvironmentDetail> => {
		await this.smartviewOpenApplication( payload );
		const body = await this.smartviewGetXMLTemplate( 'req_OpenCube.xml', { SID: payload.SID, server: payload.smartview.planningserver, database: payload.database, table: 'HSP_DIM_' + field.name } );
		const { $ } = await this.smartviewPoster( { url: payload.smartview.planningurl, body, cookie: payload.smartview.cookies } );

		let isSuccessful = false;
		$( 'body' ).children().toArray().forEach( curElem => {
			if ( curElem.name === 'res_opencube' ) { isSuccessful = true; }
		} );
		if ( isSuccessful ) throw ( new Error( 'Failure to open dimension ' + payload.name + '@smartviewOpenDimension' ) );
		return payload;
	}
	private smartviewGetDescriptionsAction = async ( payload: ATEnvironmentDetail, field: ATStreamField ): Promise<ATEnvironmentDetail> => {
		const numberofColumns = 3; // Because columns are membername, description and desired aliastable name
		const body = await this.smartviewGetXMLTemplate( 'req_ExecuteGridforDescriptions.xml', {
			SID: payload.SID,
			numberofColumns,
			table: payload.table,
			name: field.name,
			rangeend: ( numberofColumns * 2 - 1 ),
			descriptiveTable: field.description.table
		} );
		const { $ } = await this.smartviewPoster( { url: payload.smartview.planningurl, body, cookie: payload.smartview.cookies } );

		let isSuccessful = false;
		$( 'body' ).children().toArray().forEach( curElem => {
			if ( curElem.name === 'res_executegrid' ) { isSuccessful = true; }
		} );

		const rangeStart = parseInt( $( 'range' ).attr( 'start' ), 10 );

		if ( !isSuccessful ) {
			throw ( new Error( 'Failure to get descriptions ' + payload.name + '@smartviewGetDescriptionsAction' ) );
		} else if ( rangeStart > 1 ) {
			throw ( new Error( 'Failure to get descriptions, wrong number returned for rangeStart ' + payload.name + '@smartviewGetDescriptionsAction' ) );
		} else {
			const vals = $( 'vals' ).text().split( '|' );
			vals.splice( 0, ( numberofColumns - rangeStart ) );
			payload.smartview.memberList = [];
			while ( vals.length ) {
				const curMemberArray = vals.splice( 0, numberofColumns );
				const curMember: { RefField: string, Description: string } = { RefField: curMemberArray[0], Description: curMemberArray[numberofColumns - 1] };
				if ( !curMember.Description ) { curMember.Description = curMemberArray[numberofColumns - 2]; }
				if ( !curMember.Description ) { curMember.Description = curMemberArray[0]; }
				payload.smartview.memberList.push( curMember );
			}
		}
		return payload;
	}
	public listAliasTables = async ( payload: ATEnvironmentDetail ) => {
		await this.smartviewListAliasTables( payload );
		return payload.smartview.aliastables.map( t => ( { name: t, type: 'Alias Table' } ) );
	}
	private smartviewListAliasTables = async ( payload: ATEnvironmentDetail ): Promise<ATEnvironmentDetail> => {
		await this.smartviewOpenCube( payload );
		const body = await this.smartviewGetXMLTemplate( 'req_EnumAliasTables.xml', payload );
		const { $ } = await this.smartviewPoster( { url: payload.smartview.planningurl, body, cookie: payload.smartview.cookies } );

		let isSuccessful = false;
		$( 'body' ).children().toArray().forEach( curElem => {
			if ( curElem.name === 'res_enumaliastables' ) { isSuccessful = true; }
		} );
		if ( isSuccessful ) throw ( new Error( 'Failure to list alias tables ' + payload.name + '@smartviewListAliasTables' ) );
		payload.smartview.aliastables = $( 'alstbls' ).text().split( '|' );
		return payload;
	}
	public listDimensions = async ( payload: ATEnvironmentDetail ) => {
		await this.smartviewListDimensions( payload );
		return payload.smartview.dimensions;
	}
	private smartviewListDimensions = async ( payload: ATEnvironmentDetail ): Promise<ATEnvironmentDetail> => {
		await this.smartviewOpenCube( payload );
		const body = await this.smartviewGetXMLTemplate( 'req_EnumDims.xml', payload );
		const { $ } = await this.smartviewPoster( { url: payload.smartview.planningurl, body, cookie: payload.smartview.cookies } );

		let isSuccessful = false;
		$( 'body' ).children().toArray().forEach( curElem => {
			if ( curElem.name === 'res_enumdims' ) { isSuccessful = true; }
		} );
		if ( !isSuccessful ) throw ( new Error( 'Failure to list dimensions ' + payload.name + '@smartviewListDimensions' ) );

		payload.smartview.dimensions = [];
		$( 'dim' ).toArray().forEach( curDim => {
			payload.smartview.dimensions.push( { name: curDim.attribs.name, type: ( curDim.attribs.type === 'None' ? 'Generic' : curDim.attribs.type ), isDescribed: 1 } );
		} );
		return payload;
	}
	public listCubes = async ( payload: ATEnvironmentDetail ) => {
		await this.smartviewListCubes( payload );
		return payload.smartview.cubes.map( c => ( { name: c, type: 'cube' } ) );
	}
	private smartviewListDocuments = async ( payload: ATEnvironmentDetail ): Promise<ATEnvironmentDetail> => {
		const body = await this.smartviewGetXMLTemplate( 'req_ListDocuments.xml', payload );
		const { $ } = await this.smartviewPoster( { url: payload.smartview.planningurl, body, cookie: payload.smartview.cookies } );

		let isSuccessful = false;
		$( 'body' ).children().toArray().forEach( curElem => {
			if ( curElem.name === 'res_listdocuments' ) { isSuccessful = true; }
		} );
		if ( isSuccessful ) throw ( new Error( 'Failure to list documents ' + payload.name + '@smartviewListDocuments' ) );
		return payload;
	}
	private smartviewGetAvailableServices = async ( payload: ATEnvironmentDetail ): Promise<ATEnvironmentDetail> => {
		const body = await this.smartviewGetXMLTemplate( 'req_GetAvailableServices.xml', payload );
		const { $ } = await this.smartviewPoster( { url: payload.smartview.planningurl, body, cookie: payload.smartview.cookies } );

		let isSuccessful = false;
		$( 'body' ).children().toArray().forEach( curElem => {
			if ( curElem.name === 'res_getavailableservices' ) { isSuccessful = true; }
		} );
		if ( !isSuccessful ) throw ( new Error( 'Failure to get available services ' + payload.name + '@smartviewGetAvailableServices' ) );
		return payload;
	}
	public listApplications = async ( payload: ATEnvironmentDetail ) => {
		await this.smartviewListApplications( payload );
		return payload.smartview.applications;
	}
	private smartviewListApplicationsValidator = async ( payload: ATEnvironmentDetail ): Promise<ATEnvironmentDetail> => {
		await this.smartviewListServers( payload );
		const body = await this.smartviewGetXMLTemplate( 'req_ListApplications.xml', payload );
		const { $ } = await this.smartviewPoster( { url: payload.smartview.planningurl, body, cookie: payload.smartview.cookies } );

		let isListed = false;
		$( 'body' ).children().toArray().forEach( curElem => {
			if ( curElem.name === 'res_listapplications' ) { isListed = true; }
		} );

		if ( !isListed ) throw new Error( 'Failure to list applications@smartviewListApplications' );

		payload.smartview.applications = $( 'apps' ).text().split( '|' ).map( curApp => ( { name: curApp } ) );
		return payload;
	}
	public listServers = async ( payload: ATEnvironmentDetail ) => {
		await this.smartviewListServers( payload );
		return payload.smartview.planningserver;
	}
	public smartviewListServers = async ( payload: ATEnvironmentDetail ): Promise<ATEnvironmentDetail> => {
		const body = await this.smartviewGetXMLTemplate( 'req_ListServers.xml', payload );
		const { $ } = await this.smartviewPoster( { url: payload.smartview.planningurl, body, cookie: payload.smartview.cookies } );
		let isListed = false;
		$( 'body' ).children().toArray().forEach( curElem => {
			if ( curElem.name === 'res_listservers' ) { isListed = true; }
		} );

		if ( !isListed ) throw new Error( 'Failure to list servers@smartviewListServers' );

		payload.smartview.planningserver = $( 'srvs' ).text();
		return payload;
	}
	private smartviewEstablishConnection = ( payload: ATEnvironmentDetail ): Promise<ATEnvironmentDetail> => {
		return new Promise( ( resolve, reject ) => {
			this.smartviewEstablishConnectionAction( payload )
				.catch( ( failure: Error ) => { console.error( 'Establish connection failed 01:', payload.name, failure.message ); return this.smartviewWaiter( payload ).then( this.smartviewEstablishConnectionAction ); } )
				.catch( ( failure: Error ) => { console.error( 'Establish connection failed 02:', payload.name, failure.message ); return this.smartviewWaiter( payload ).then( this.smartviewEstablishConnectionAction ); } )
				.catch( ( failure: Error ) => { console.error( 'Establish connection failed 03:', payload.name, failure.message ); return this.smartviewWaiter( payload ).then( this.smartviewEstablishConnectionAction ); } )
				.catch( ( failure: Error ) => { console.error( 'Establish connection failed 04:', payload.name, failure.message ); return this.smartviewWaiter( payload ).then( this.smartviewEstablishConnectionAction ); } )
				.catch( ( failure: Error ) => { console.error( 'Establish connection failed 05:', payload.name, failure.message ); return this.smartviewWaiter( payload ).then( this.smartviewEstablishConnectionAction ); } )
				.catch( ( failure: Error ) => { console.error( 'Establish connection failed 06:', payload.name, failure.message ); return this.smartviewWaiter( payload ).then( this.smartviewEstablishConnectionAction ); } )
				.catch( ( failure: Error ) => { console.error( 'Establish connection failed 07:', payload.name, failure.message ); return this.smartviewWaiter( payload ).then( this.smartviewEstablishConnectionAction ); } )
				.catch( ( failure: Error ) => { console.error( 'Establish connection failed 08:', payload.name, failure.message ); return this.smartviewWaiter( payload ).then( this.smartviewEstablishConnectionAction ); } )
				.catch( ( failure: Error ) => { console.error( 'Establish connection failed 09:', payload.name, failure.message ); return this.smartviewWaiter( payload ).then( this.smartviewEstablishConnectionAction ); } )
				.catch( ( failure: Error ) => { console.error( 'Establish connection failed 10:', payload.name, failure.message ); return this.smartviewWaiter( payload ).then( this.smartviewEstablishConnectionAction ); } )
				.catch( ( failure: Error ) => { console.error( 'Establish connection failed 11:', payload.name, failure.message ); return this.smartviewWaiter( payload ).then( this.smartviewEstablishConnectionAction ); } )
				.catch( ( failure: Error ) => { console.error( 'Establish connection failed 12:', payload.name, failure.message ); return this.smartviewWaiter( payload ).then( this.smartviewEstablishConnectionAction ); } )
				.then( resolve )
				.catch( reject );
		} );
	}
	private smartviewEstablishConnectionAction = async ( payload: ATEnvironmentDetail ): Promise<ATEnvironmentDetail> => {
		await this.smartviewPrepareEnvironment( payload );
		const body = await this.smartviewGetXMLTemplate( 'req_ConnectToProvider.xml', {} );
		const { $, body: rBody } = await this.smartviewPoster( { url: payload.smartview.planningurl, body, cookie: payload.smartview.cookies } );
		let isConnectionEstablished = false;
		$( 'body' ).children().toArray().forEach( curElem => {
			if ( curElem.name === 'res_connecttoprovider' ) { isConnectionEstablished = true; }
		} );
		if ( !isConnectionEstablished ) {
			throw new Error( 'Establish Connection - Failure to connect smartview provider: ' + payload.name + '->' + rBody );
		}
		return payload;
	}
	private smartviewWaiter = ( payload: ATEnvironmentDetail, timeToWait = 5000 ): Promise<ATEnvironmentDetail> => {
		return new Promise( ( resolve, reject ) => {
			setTimeout( () => { resolve( payload ); }, timeToWait );
		} );
	}
	private smartviewPrepareEnvironment = async ( payload: ATEnvironmentDetail ): Promise<ATEnvironmentDetail> => {
		payload.smartview.url = payload.server + ':' + payload.port + '/workspace/SmartViewProviders';
		payload.smartview.planningurl = payload.server + ':' + payload.port + '/HyperionPlanning/SmartView';
		if ( !payload.smartview.cookies ) { payload.smartview.cookies = ''; }
		return payload;
	}
	private hpObtainSID = ( payload: ATEnvironmentDetail ): Promise<ATEnvironmentDetail> => {
		return this.smartviewEstablishConnection( payload ).then( this.hpObtainSID01 ).then( this.hpObtainSID02 );
	}
	private hpObtainSID01 = async ( payload: ATEnvironmentDetail ): Promise<ATEnvironmentDetail> => {
		const body = await this.smartviewGetXMLTemplate( 'req_GetProvisionedDataSourcesWithCredentials.xml', payload );
		const { $ } = await this.smartviewPoster( { url: payload.smartview.url, body } );

		$( 'Product' ).each( ( i: any, elem: any ) => {
			if ( $( elem ).attr( 'id' ) === 'HP' ) {
				payload.smartview.planningurl = payload.server + ':' + payload.port + $( elem ).children( 'Server' ).attr( 'context' );
			}
		} );
		payload.ssotoken = $( 'sso' ).text();
		if ( !payload.smartview.planningurl ) {
			throw new Error( 'No planning url could be identified ' + payload.name + '@hpObtainSID01' );
		} else if ( !payload.ssotoken ) {
			throw new Error( 'No sso token was found ' + payload.name + '@hpObtainSID01' );
		} else {
			return payload;
		}
	}
	private hpObtainSID02 = async ( payload: ATEnvironmentDetail ): Promise<ATEnvironmentDetail> => {
		const body = await this.smartviewGetXMLTemplate( 'req_ConnectToProviderSSO.xml', { ssotoken: payload.ssotoken } );
		const { $ } = await this.smartviewPoster( { url: payload.smartview.planningurl, body } );
		payload.SID = $( 'sID' ).text();
		if ( payload.SID ) {
			return payload;
		} else {
			throw new Error( 'No SID found ' + payload.name + '@hpObtainSID02' );
		}
	}
	private pbcsObtainSID = ( payload: ATEnvironmentDetail ): Promise<ATEnvironmentDetail> => {
		return this.smartviewPrepareEnvironment( payload )
			.then( this.pbcsObtainSID01 )
			.then( this.pbcsObtainSID02 )
			.then( this.pbcsObtainSID03 )
			.then( this.pbcsObtainSID04 )
			.then( this.pbcsObtainSID05 )
			.then( this.pbcsObtainSID06 )
			.then( this.pbcsObtainSID07 )
			.then( this.pbcsObtainSID08 )
			.then( this.pbcsObtainSID09 )
			.then( this.pbcsObtainSID10 );
	}
	private pbcsGetCookieString = ( sourceCookie: string | any, existingCookie?: string ) => {
		let targetCookie = '';
		if ( sourceCookie ) {
			if ( Array.isArray( sourceCookie ) ) {
				targetCookie = sourceCookie.join( '; ' );
			} else {
				targetCookie = sourceCookie;
			}
		}
		if ( existingCookie ) { targetCookie += existingCookie + '; ' + targetCookie; }
		return targetCookie;
	}
	private pbcsGetRequestContext = ( source: any ) => {
		let toReturn = '';
		if ( Array.isArray( source ) ) {
			if ( source ) {
				source.forEach( ( curSource: string ) => {
					if ( curSource.trim().substr( 0, 17 ) === 'OAMRequestContext' ) {
						toReturn = curSource.trim();
					}
				} );
			}
		}
		return toReturn;
	}
	private pbcsObtainSID01 = async ( payload: ATEnvironmentDetail ): Promise<{ payload: ATEnvironmentDetail, refDetails: any }> => {
		const refDetails: any = {};
		refDetails.originalCookie = 'EPM_Remote_User=; ORA_EPMWS_User=' + encodeURIComponent( payload.username ) + '; ORA_EPMWS_Locale=en_US; ORA_EPMWS_AccessibilityMode=false; ORA_EPMWS_ThemeSelection=Skyros';
		const body = await this.smartviewGetXMLTemplate( 'req_ConnectToProvider.xml', {} );
		const { response } = await this.smartviewPoster( { url: payload.smartview.url, body, followRedirect: false } );

		refDetails.redirectTarget = response.headers.location;
		refDetails.requestContext = this.pbcsGetRequestContext( response.headers['set-cookie'] );
		if ( refDetails.requestContext === '' ) {
			throw new Error( 'No request context retrieved ' + payload.name + '@pbcsObtainSID01' );
		} else {
			return { payload, refDetails };
		}
	}
	private pbcsObtainSID02 = async ( refInfo: { payload: ATEnvironmentDetail, refDetails: any } ): Promise<{ payload: ATEnvironmentDetail, refDetails: any }> => {
		refInfo.refDetails.oamPrefsCookie = 'OAM_PREFS=dGVuYW50TmFtZT1rZXJ6bmVyfnJlbWVtYmVyVGVuYW50PXRydWV+cmVtZW1iZXJNZT1mYWxzZQ==';
		await this.smartviewGetter( { url: refInfo.refDetails.redirectTarget, cookie: refInfo.refDetails.oamPrefsCookie, followRedirect: false } );
		return refInfo;
	}
	private pbcsObtainSID03 = async ( refInfo: { payload: ATEnvironmentDetail, refDetails: any } ): Promise<{ payload: ATEnvironmentDetail, refDetails: any }> => {
		const { response } = await this.smartviewGetter( {
			url: refInfo.payload.server + ':' + refInfo.payload.port + '/workspace/SmartViewProviders',
			cookie: refInfo.refDetails.originalCookie + '; ' + refInfo.refDetails.requestContext,
			followRedirect: false
		} );
		refInfo.refDetails.redirectTarget = response.headers.location;
		if ( this.pbcsGetRequestContext( response.headers['set-cookie'] ) ) {
			refInfo.refDetails.requestContext += '; ' + this.pbcsGetRequestContext( response.headers['set-cookie'] );
		}
		if ( refInfo.refDetails.requestContext === '' ) {
			throw new Error( 'No request context retrieved ' + refInfo.payload.name + '@pbcsObtainSID03' );
		} else {
			refInfo.refDetails.encquery = url.parse( refInfo.refDetails.redirectTarget ).search;
			return refInfo;
		}
	}
	private pbcsObtainSID04 = async ( refInfo: { payload: ATEnvironmentDetail, refDetails: any } ): Promise<{ payload: ATEnvironmentDetail, refDetails: any }> => {
		const { response, $ } = await this.smartviewGetter( { url: refInfo.refDetails.redirectTarget, cookie: refInfo.refDetails.oamPrefsCookie, followRedirect: false } );
		refInfo.refDetails.formFields = {};
		$( 'input' ).each( ( i: any, elem: any ) => {
			if ( $( elem.parent ).attr( 'name' ) === 'signin_form' ) {
				refInfo.refDetails.formFields[$( elem ).attr( 'name' )] = $( elem ).val();
			}
		} );
		$( 'form' ).each( ( i: any, elem: any ) => {
			if ( $( elem ).attr( 'name' ) === 'signin_form' ) {
				refInfo.refDetails.formAction = response.request.uri.protocol + '//' + response.request.uri.hostname + $( elem ).attr( 'action' );
			}
		} );

		refInfo.refDetails.formFields.username = refInfo.payload.username;
		refInfo.refDetails.formFields.password = refInfo.payload.password;
		refInfo.refDetails.formFields.userid = refInfo.payload.username;
		refInfo.refDetails.formFields.tenantDisplayName = refInfo.payload.identitydomain;
		refInfo.refDetails.formFields.tenantName = refInfo.payload.identitydomain;

		refInfo.refDetails.formCookie = this.pbcsGetCookieString( response.headers['set-cookie'] );
		if ( refInfo.refDetails.formAction ) {
			return refInfo;
		} else {
			throw new Error( 'Form action is not set ' + refInfo.payload.name + '@pbcsObtainSID04' );
		}
	}
	private pbcsObtainSID05 = async ( refInfo: { payload: ATEnvironmentDetail, refDetails: any } ): Promise<{ payload: ATEnvironmentDetail, refDetails: any }> => {
		const { response } = await this.smartviewPoster( {
			url: refInfo.refDetails.formAction,
			referer: refInfo.refDetails.redirectTarget,
			cookie: refInfo.refDetails.oamPrefsCookie + '; ' + refInfo.refDetails.formCookie,
			form: refInfo.refDetails.formFields,
			followRedirect: false
		} );
		refInfo.refDetails.formResponseCookie = this.pbcsGetCookieString( response.headers['set-cookie'] );
		refInfo.refDetails.redirectTarget = response.headers.location;
		refInfo.refDetails.referer = refInfo.refDetails.formAction + refInfo.refDetails.encquery;
		return refInfo;
	}
	private pbcsObtainSID06 = async ( refInfo: { payload: ATEnvironmentDetail, refDetails: any } ): Promise<{ payload: ATEnvironmentDetail, refDetails: any }> => {
		const { response } = await this.smartviewGetter( { url: refInfo.refDetails.redirectTarget, referer: refInfo.refDetails.referer, followRedirect: false } );
		refInfo.refDetails.currentCookie += '; ' + this.pbcsGetCookieString( response.headers['set-cookie'] );
		refInfo.refDetails.redirectTarget = refInfo.payload.server + response.headers.location;
		return refInfo;
	}
	private pbcsObtainSID07 = async ( refInfo: { payload: ATEnvironmentDetail, refDetails: any } ): Promise<{ payload: ATEnvironmentDetail, refDetails: any }> => {
		const { response } = await this.smartviewGetter( { url: refInfo.refDetails.redirectTarget, cookie: refInfo.refDetails.currentCookie, referer: refInfo.refDetails.referer, followRedirect: false } );
		refInfo.refDetails.currentCookie += '; ' + this.pbcsGetCookieString( response.headers['set-cookie'] );
		return refInfo;
	}
	private pbcsObtainSID08 = async ( refInfo: { payload: ATEnvironmentDetail, refDetails: any } ): Promise<{ payload: ATEnvironmentDetail, refDetails: any }> => {
		const body = await this.smartviewGetXMLTemplate( 'req_ConnectToProvider.xml', {} );
		const { $ } = await this.smartviewPoster( { url: refInfo.refDetails.redirectTarget, cookie: refInfo.refDetails.currentCookie, body, followRedirect: false } );
		return refInfo;
	}
	private pbcsObtainSID09 = async ( refInfo: { payload: ATEnvironmentDetail, refDetails: any } ): Promise<{ payload: ATEnvironmentDetail, refDetails: any }> => {
		const body = await this.smartviewGetXMLTemplate( 'req_GetProvisionedDataSources.xml', {} );
		const { $ } = await this.smartviewPoster( { url: refInfo.refDetails.redirectTarget, cookie: refInfo.refDetails.currentCookie, body, followRedirect: false } );
		$( 'Product' ).each( ( i: any, elem: any ) => {
			if ( $( elem ).attr( 'id' ) === 'HP' ) {
				refInfo.payload.smartview.planningurl = refInfo.payload.server + ':' + refInfo.payload.port + $( elem ).children( 'Server' ).attr( 'context' );
			}
		} );
		refInfo.payload.ssotoken = $( 'sso' ).text();
		if ( !refInfo.payload.smartview.planningurl ) {
			throw new Error( 'No planning url could be identified ' + refInfo.payload.name + '@pbcsObtainSID09' );
		} else if ( !refInfo.payload.ssotoken ) {
			throw new Error( 'No sso token was found ' + refInfo.payload.name + '@pbcsObtainSID09' );
		} else {
			return refInfo;
		}
	}
	private pbcsObtainSID10 = async ( refInfo: { payload: ATEnvironmentDetail, refDetails: any } ): Promise<ATEnvironmentDetail> => {
		const body = await this.smartviewGetXMLTemplate( 'req_ConnectToProviderSSO.xml', { ssotoken: refInfo.payload.ssotoken } );
		const { $ } = await this.smartviewPoster( { url: refInfo.payload.smartview.planningurl, cookie: refInfo.refDetails.currentCookie, body } );
		refInfo.payload.SID = $( 'sID' ).text;
		refInfo.payload.smartview.cookies = refInfo.refDetails.currentCookie;
		if ( refInfo.payload.SID ) {
			return refInfo.payload;
		} else {
			throw new Error( 'No SID found ' + refInfo.payload.name + '@pbcsObtainSID10' );
		}
	}
	private smartviewRequester = ( options: ATSmartViewRequestOptions ): Promise<{ body: any, $: CheerioStatic, options: ATSmartViewRequestOptions, response: any }> => {
		return new Promise( ( resolve, reject ) => {
			const requestOptions: any = {
				url: options.url,
				method: options.method,
				body: options.body,
				headers: { 'Content-Type': options.contentType || 'application/xml' },
				timeout: options.timeout || 120000,
				followRedirect: options.followRedirect === false ? false : true
			};
			if ( options.cookie ) requestOptions.headers.cookie = options.cookie;
			if ( options.referer ) requestOptions.headers.referer = options.referer;
			request( requestOptions, ( err: Error, response: any, body: any ) => {
				if ( err ) {
					reject( err );
				} else {
					try {
						resolve( { body, $: cheerio.load( body ), options, response } );
					} catch ( error ) {
						reject( error );
					}
				}
			} );
		} );
	}
	private smartviewPoster = ( options: ATSmartViewRequestOptions ) => this.smartviewRequester( Object.assign( { method: 'POST' }, options ) );
	private smartviewGetter = ( options: ATSmartViewRequestOptions ) => this.smartviewRequester( Object.assign( { method: 'GET' }, options ) );
}
// import { Pool } from 'mysql';
// import * as xml2js from 'xml2js';
// import * as request from 'request';
// import * as url from 'url';

// import * as asynclib from 'async';

// import { MainTools } from './tools.main';
// import { ATEnvironmentDetail } from '../../shared/model/dime/environmentSmartView';
// import { DimeEnvironmentType } from '../../shared/enums/dime/environmenttypes';
// import { DimeStreamFieldDetail } from '../../shared/model/dime/streamfield';
// import { SmartViewRequestOptions } from '../../shared/model/dime/smartviewrequestoptions';
// import { SortByName, encodeXML, SortByPosition, waiter, arrayCartesian } from '../../shared/utilities/utilityFunctions';
// import * as _ from 'lodash';
// import * as path from 'path';
// import * as Handlebars from 'handlebars';
// import * as Promisers from '../../shared/utilities/promisers';
// import { findMembers } from '../../shared/utilities/hpUtilities';

// export class SmartViewTools {
// 	xmlBuilder: xml2js.Builder;
// 	xmlParser: xml2js.Parser;
// 	constructor( public db: Pool, public tools: MainTools ) {		this.xmlBuilder = new xml2js.Builder();		this.xmlParser = new xml2js.Parser(); 	}


// }
