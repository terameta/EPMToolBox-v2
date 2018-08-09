import { DB } from './tools.db';
import { MainTools } from './tools.main';
import { ATEnvironmentDetail, ATEnvironmentType } from '../../shared/models/at.environment';
import * as Promisers from '../../shared/utilities/promisers';
import { join } from 'path';
import { compile as hbCompile } from 'handlebars';
import { ATSmartViewRequestOptions } from '../../shared/models/at.smartview';
import { CheerioStatic } from 'cheerio';
import * as cheerio from 'cheerio';
import * as request from 'request';
import * as url from 'url';
import { ATStreamField } from '../../shared/models/at.stream';
import { SortByName, encodeXML, SortByPosition, arrayCartesian } from '../../shared/utilities/utilityFunctions';
import { findMembers } from '../../shared/utilities/hpUtilities';
import * as puppeteer from 'puppeteer';
import { HttpMethod } from 'puppeteer';

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

		const hasFailed = $( 'body' ).children().toArray().filter( e => e.name === 'res_opencube' ).length === 0;
		if ( hasFailed ) throw ( new Error( 'Failure to open cube ' + payload.name + '@smartviewOpenCube' ) );
		return payload;
	}
	private smartviewListCubes = async ( payload: ATEnvironmentDetail ): Promise<ATEnvironmentDetail> => {
		await this.smartviewOpenApplication( payload );
		await this.smartviewGetAvailableServices( payload );
		await this.smartviewListDocuments( payload );
		const body = await this.smartviewGetXMLTemplate( 'req_ListCubes.xml', payload );
		const { $ } = await this.smartviewPoster( { url: payload.smartview.planningurl, body, cookie: payload.smartview.cookies } );

		const hasFailed = $( 'body' ).children().toArray().filter( e => e.name === 'res_listcubes' ).length === 0;
		if ( hasFailed ) throw ( new Error( 'Failure to list cubes ' + payload.name + '@smartviewListCubes' ) );
		payload.smartview.cubes = $( 'cubes' ).text().split( '|' );
		return payload;
	}
	private smartviewOpenApplication = async ( payload: ATEnvironmentDetail ): Promise<ATEnvironmentDetail> => {
		await this.listApplications( payload );
		const body = await this.smartviewGetXMLTemplate( 'req_OpenApplication.xml', payload );
		const { $ } = await this.smartviewPoster( { url: payload.smartview.planningurl, body, cookie: payload.smartview.cookies } );

		const hasFailed = $( 'body' ).children().toArray().filter( e => e.name === 'res_openapplication' ).length === 0;
		if ( hasFailed ) throw ( new Error( 'Failure to open application ' + payload.name + '@smartviewOpenApplication' ) );
		return payload;
	}
	public smartviewListApplications = ( payload: ATEnvironmentDetail ): Promise<ATEnvironmentDetail> => {
		// Validate SID function tries the smartviewListApplicationsValidator
		// If successful we have the applications listed in the response already
		// We made this so that we can avoid the circular reference
		return this.validateSID( payload );
	}
	public validateSID = async ( payload: ATEnvironmentDetail ): Promise<ATEnvironmentDetail> => {
		if ( payload.SID ) {
			delete payload.SID;
			delete payload.smartview.cookies;
			return this.validateSID( payload );
		} else {
			switch ( payload.type ) {
				case ATEnvironmentType.PBCS: {
					return this.pbcsObtainSID( payload ).then( this.smartviewListApplicationsValidator );
				}
				case ATEnvironmentType.HP: {
					return this.hpObtainSID( payload ).then( this.smartviewListApplicationsValidator );
				}
				default: {
					throw ( new Error( 'Not a valid environment type' ) );
				}
			}
		}
	}
	public smartviewReadDataPrepare = async ( payload ) => {
		await this.smartviewOpenCube( payload );

		payload.query.hierarchies = await this.smartviewGetAllDescriptionsWithHierarchy( payload, Object.values( <ATStreamField[]>payload.query.dimensions ).sort( SortByPosition ) );
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

		const bodyXML = await Promisers.readFile( join( __dirname, './tools.smartview.assets/req_Refresh.xml' ) );
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
				return this.smartviewPoster( { url: resEnv.smartview.planningurl, body, cookie: resEnv.smartview.cookies, timeout: 120000000 } );
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
	private smartviewRunBusinessRuleAction = async ( payload ): Promise<any> => {
		await this.smartviewOpenCube( payload );
		const body = await this.smartviewGetXMLTemplate( 'req_LaunchBusinessRule.xml', payload );
		const { $, body: rBody } = await this.smartviewPoster( { url: payload.smartview.planningurl, body, cookie: payload.smartview.cookies } );
		const hasFailed = $( 'body' ).children().toArray().filter( elem => ( elem.name === 'res_launchbusinessrule' ) ).length === 0;
		if ( hasFailed ) throw ( new Error( 'There is an issue with running business rule ' + rBody ) );
	}
	public writeData = ( payload ) => this.smartviewWriteData( payload );
	private smartviewWriteData = async ( payload ): Promise<ATEnvironmentDetail> => {
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
		await this.smartviewWriteDataSendChuncks( payload, chunkedData );
		return <ATEnvironmentDetail>payload;
	}
	private smartviewWriteDataSendChuncks = async ( payload, chunks: any[] ) => {
		for ( const chunck of chunks ) {
			payload.data = chunck;
			await this.smartviewWriteDataTry( payload, 0 );
		}
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
			return this.smartviewPoster( { url: resEnv.smartview.planningurl, body, cookie: resEnv.smartview.cookies } );
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
			const hasFailed = response.$( 'body' ).children().toArray().filter( elem => ( elem.name === 'res_writeback' ) ).length === 0;
			if ( hasFailed ) {
				return Promise.reject( new Error( 'Failed to write data:' + response.body ) );
			} else {
				return Promise.resolve( 'Data is pushed to Hyperion Planning' );
			}
		} );
	}
	public listBusinessRuleDetails = async ( payload: ATEnvironmentDetail ) => {
		await this.smartviewListBusinessRuleDetails( payload );
		return payload.smartview.procedure.variables;
	}
	private smartviewListBusinessRuleDetails = async ( payload: ATEnvironmentDetail ): Promise<ATEnvironmentDetail> => {
		await this.smartviewOpenCube( payload );
		const body = await this.smartviewGetXMLTemplate( 'req_EnumRunTimePrompts.xml', {
			SID: payload.SID,
			table: payload.table,
			ruleType: payload.smartview.procedure.type,
			ruleName: payload.smartview.procedure.name
		} );
		const { $ } = await this.smartviewPoster( { url: payload.smartview.planningurl, body, cookie: payload.smartview.cookies } );
		const rtps: any[] = [];
		$( 'rtp' ).toArray().forEach( rtp => {
			const toPush: any = {};
			toPush.name = $( rtp ).find( 'name' ).text();
			toPush.description = $( rtp ).find( 'description' ).text();
			toPush.dimension = $( rtp ).find( 'member' ).toArray()[0].attribs.dim;
			toPush.memberselect = $( rtp ).find( 'member' ).toArray()[0].attribs.mbrselect;
			if ( toPush.memberselect === '0' ) {
				toPush.memberselect = false;
			} else {
				toPush.memberselect = true;
			}
			toPush.choice = $( rtp ).find( 'member' ).toArray()[0].attribs.choice;
			toPush.defaultmember = $( rtp ).find( 'member' ).find( 'default' ).text();
			toPush.allowmissing = $( rtp ).find( 'allowMissing' ).text();
			rtps.push( toPush );
		} );
		payload.smartview.procedure.variables = rtps;
		return payload;
	}
	public listBusinessRules = async ( payload: ATEnvironmentDetail ) => {
		await this.smartviewListBusinessRules( payload );
		return payload.smartview.ruleList;
	}
	private smartviewListBusinessRules = async ( payload: ATEnvironmentDetail ): Promise<ATEnvironmentDetail> => {
		await this.smartviewOpenCube( payload );
		const body = await this.smartviewGetXMLTemplate( 'req_EnumBusinessRules.xml', payload );
		const { $ } = await this.smartviewPoster( { url: payload.smartview.planningurl, body, cookie: payload.smartview.cookies } );

		const hasFailed = $( 'body' ).children().toArray().filter( elem => ( elem.name === 'res_enumbusinessrules' ) ).length === 0;
		if ( hasFailed ) throw ( new Error( 'Failure to list business rules ' + payload.name + '@smartviewListBusinessRules' ) );
		payload.smartview.ruleList = $( 'rule' ).toArray().map( rule => ( { name: $( rule ).text(), hasRTP: rule.attribs.rtp, type: rule.attribs.type } ) );
		return payload;
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

		const hasFailed = $( 'body' ).children().toArray().filter( e => e.name === 'res_executegrid' ).length === 0;

		const rangeStart = parseInt( $( 'range' ).attr( 'start' ), 10 );

		if ( hasFailed ) {
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

		const hasFailed = $( 'body' ).children().toArray().filter( e => e.name === 'res_opencube' ).length === 0;
		if ( hasFailed ) throw ( new Error( 'Failure to open dimension ' + payload.name + '@smartviewOpenDimension' ) );
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

		const hasFailed = $( 'body' ).children().toArray().filter( e => e.name === 'res_executegrid' ).length === 0;
		const rangeStart = parseInt( $( 'range' ).attr( 'start' ), 10 );

		if ( hasFailed ) {
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

		const hasFailed = $( 'body' ).children().toArray().filter( e => e.name === 'res_enumaliastables' ).length === 0;
		if ( hasFailed ) throw ( new Error( 'Failure to list alias tables ' + payload.name + '@smartviewListAliasTables' ) );
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

		const hasFailed = $( 'body' ).children().toArray().filter( e => e.name === 'res_enumdims' ).length === 0;
		if ( hasFailed ) throw ( new Error( 'Failure to list dimensions ' + payload.name + '@smartviewListDimensions' ) );

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

		const hasFailed = $( 'body' ).children().toArray().filter( e => e.name === 'res_listdocuments' ).length === 0;
		if ( hasFailed ) throw ( new Error( 'Failure to list documents ' + payload.name + '@smartviewListDocuments' ) );
		return payload;
	}
	private smartviewGetAvailableServices = async ( payload: ATEnvironmentDetail ): Promise<ATEnvironmentDetail> => {
		const body = await this.smartviewGetXMLTemplate( 'req_GetAvailableServices.xml', payload );
		const { $ } = await this.smartviewPoster( { url: payload.smartview.planningurl, body, cookie: payload.smartview.cookies } );

		const hasFailed = $( 'body' ).children().toArray().filter( e => e.name === 'res_getavailableservices' ).length === 0;
		if ( hasFailed ) throw ( new Error( 'Failure to get available services ' + payload.name + '@smartviewGetAvailableServices' ) );
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
		if ( !payload.smartview ) payload.smartview = <any>{};
		payload.smartview.url = payload.server + ':' + payload.port + '/workspace/SmartViewProviders';
		payload.smartview.planningurl = payload.server + ':' + payload.port + '/HyperionPlanning/SmartView';
		payload.smartview.jar = request.jar();
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
	private pbcsObtainSID = async ( payload: ATEnvironmentDetail ): Promise<ATEnvironmentDetail> => {
		for ( let x = 0; x < 100; x++ ) console.log( '===========================================' );
		await this.smartviewWaiter( payload, 5000 );
		for ( let x = 0; x < 100; x++ ) console.log( '!==========================================' );
		console.clear(); console.clear(); console.clear();
		await this.smartviewPrepareEnvironment( payload );
		const browser = await puppeteer.launch( { headless: false } );
		const page = await browser.newPage();
		await page.setViewport( { width: 1024, height: 768 } );
		await page.screenshot( { path: 'screenshots/puppet-0001.png' } );
		await page.goto( payload.smartview.url );
		await page.screenshot( { path: 'screenshots/puppet-0002.png' } );
		await page.type( '#username', payload.username );
		await page.type( '#password', payload.password );
		await page.screenshot( { path: 'screenshots/puppet-0003.png' } );
		await page.click( 'button#signin' );
		await page.waitForNavigation().catch( console.log );
		await page.screenshot( { path: 'screenshots/puppet-0004.png' } );
		await page.setRequestInterception( true );
		page.on( 'request', async ( interceptedRequest ) => {
			// const body = await this.smartviewGetXMLTemplate( 'req_ConnectToProvider.xml', {} );
			const body = await this.smartviewGetXMLTemplate( 'req_GetProvisionedDataSources.xml', {} );
			const data: any = { 'method': <HttpMethod>'POST', 'postData': body };
			interceptedRequest.continue( data );
		} );
		const response = await page.goto( payload.smartview.url );
		const responseBody = await response.text();
		console.log( responseBody );


		console.log( '>>> Finished' );

		// await this.smartviewPrepareEnvironment( payload );
		// const browser = await puppeteer.launch( { headless: false } );
		// const page = await browser.newPage();
		// await page.setViewport( { width: 1024, height: 768 } );
		// await page.screenshot( { path: 'screenshots/puppet-0001.png' } );
		// await page.goto( payload.smartview.url );
		// await page.screenshot( { path: 'screenshots/puppet-0002.png' } );
		// await page.type( '#username', payload.username );
		// await page.type( '#password', payload.password );
		// await page.screenshot( { path: 'screenshots/puppet-0003.png' } );
		// await page.setRequestInterception( true );
		// page.on( 'request', async ( r ) => {
		// 	console.log( '>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>' );
		// 	console.log( '>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>' );
		// 	console.log( r.postData() );
		// 	console.log( '>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>' );
		// 	console.log( r.url() );
		// 	console.log( '>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>' );
		// 	console.log( '>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>' );
		// 	const data: any = { 'method': <HttpMethod>'POST', 'postData': r.postData() };
		// 	if ( r.url().indexOf( 'SmartViewProviders' ) < 0 ) {
		// 		r.continue( data );
		// 	} else {
		// 		const body = await this.smartviewGetXMLTemplate( 'req_ConnectToProvider.xml', {} );
		// 		data.postData = body;
		// 		data.headers = { 'Content-Type': 'application/xml' };
		// 		r.continue( data );
		// 	}
		// } );
		// await page.click( 'button#signin' );
		// await page.screenshot( { path: 'screenshots/puppet-0004.png' } );
		// const response = await page.waitForNavigation();
		// const responseBody = await response.text();
		// console.log( '>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>' );
		// console.log( '>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>' );
		// // console.log( await page.cookies() );
		// console.log( responseBody );
		// console.log( '>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>' );
		// console.log( '>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>' );
		// await page.screenshot( { path: 'screenshots/puppet-0005.png' } ).catch( console.log );
		// // cookies = await page.cookies();
		// // console.log( '>>> #Cookies:', cookies.length, 'We are at the form now' );
		// // console.log( '>>> #Cookies:', cookies.length );
		// // await page.type( '#username', payload.username );
		// // await page.type( '#password', payload.password );
		// // console.log( '>>> #Cookies:', cookies.length, 'Form is filled' );
		// // await page.screenshot( { path: 'screenshots/puppet-0002.png' } );
		// // await page.click( '#signin' );
		// // console.log( '>>> #Cookies:', ( await page.cookies() ).length, 'We are at the form now' );
		// // await page.waitForNavigation();
		// // console.log( '>>> #Cookies:', ( await page.cookies() ).length, 'Waited for navigation' );
		// // await page.screenshot( { path: 'screenshots/puppet-0003.png' } );
		// // await browser.close();
		// // console.log( ( new Date() ).toString() );
		await browser.close();
		await this.smartviewWaiter( payload, 450000 );
		throw new Error( 'Not yet' );
		return payload;
	}

	private pbcsObtainSIDnewtry = async ( payload: ATEnvironmentDetail ): Promise<ATEnvironmentDetail> => {
		await this.smartviewPrepareEnvironment( payload );
		await this.smartviewWaiter( payload, 10000 );
		console.clear();

		const cookieArray: { name: string, value: string }[] = [];

		let referer = '';
		let url = '';
		let cookie = '';


		// STEP 1
		this.cookieArrayPusher( cookieArray, ['EPM_Remote_User=;', 'ORA_EPMWS_User=' + encodeURIComponent( payload.username ) + ';', 'ORA_EPMWS_Locale=en_US;', 'ORA_EPMWS_AccessibilityMode=false;', 'ORA_EPMWS_ThemeSelection=Skyros'] );
		cookie = this.getCookies( cookieArray );
		referer = '';
		url = payload.smartview.url;
		const { response: rStep1, $: $Step1, body: bStep1 } = await this.smartviewGetter( { url, cookie, followRedirect: false } );

		// STEP 2
		this.cookieArrayPusher( cookieArray, rStep1.headers['set-cookie'] );
		cookie = this.getCookies( cookieArray );
		referer = url;
		url = rStep1.headers.location;
		const { response: rStep2, $: $Step2, body: bStep2 } = await this.smartviewGetter( { url, cookie, followRedirect: false, referer } );

		// STEP 3
		this.cookieArrayPusher( cookieArray, rStep2.headers['set-cookie'] );
		cookie = this.getCookies( cookieArray );
		referer = url;
		const form = this.pbcsObtainSIDFillForm( payload, $Step2, rStep2 );
		url = payload.smartview.nexturl;

		const { response: rStep3, $: $Step3, body: bStep3 } = await this.smartviewPoster( { url, cookie, followRedirect: false, referer, form } );



		console.log( '!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!' );
		cookieArray.forEach( c => console.log( c.value ) );
		console.log( '!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!' );
		console.log( rStep3.headers );
		console.log( '!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!' );
		console.log( bStep3.trim() );
		console.log( '!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!' );
		await this.smartviewWaiter( payload, 5000000 );
		return payload;
	}

	private cookieArrayPusher = ( cookieArray: { name: string, value: string }[], toPush: string[] ) => {
		toPush.forEach( source => {
			const newCookieName = source.split( '=' )[0];
			if ( cookieArray.filter( c => c.name === newCookieName ).length === 0 ) cookieArray.push( { name: newCookieName, value: source } );
			cookieArray.forEach( c => {
				if ( c.name === newCookieName ) c.value = source;
			} );
		} );
	}
	private getCookies = ( cookieArray: { name: string, value: string }[] ) => {
		return cookieArray.map( c => c.value ).join( '; ' );
	}

	private pbcsObtainSIDFillForm = ( payload: ATEnvironmentDetail, $, response: request.Response ) => {
		const formData: any = {};

		$( 'form[name=signin_form]' ).each( ( i: any, elem: any ) => {
			payload.smartview.nexturl = response.request.uri.protocol + '//' + response.request.uri.hostname + $( elem ).attr( 'action' );
			$( elem ).find( 'input' ).each( ( a: any, input: any ) => {
				// console.log( $( input ).attr( 'name' ), ':', $( input ).val() );
				formData[$( input ).attr( 'name' )] = $( input ).val();
			} );
		} );
		formData.username = payload.username;
		formData.password = payload.password;
		formData.userid = payload.username;
		formData.tenantDisplayName = payload.identitydomain;
		formData.tenantName = payload.identitydomain;
		return formData;
	}

	private pbcsObtainSIDjar = async ( payload: ATEnvironmentDetail ): Promise<ATEnvironmentDetail> => {
		console.clear();
		await this.smartviewPrepareEnvironment( payload );
		const formData: any = {};

		const { response, $ } = await this.smartviewGetter( { url: payload.smartview.url, jar: payload.smartview.jar } );
		$( 'form[name=signin_form]' ).each( ( i: any, elem: any ) => {
			payload.smartview.nexturl = response.request.uri.protocol + '//' + response.request.uri.hostname + $( elem ).attr( 'action' );
			$( elem ).find( 'input' ).each( ( a: any, input: any ) => {
				// console.log( $( input ).attr( 'name' ), ':', $( input ).val() );
				formData[$( input ).attr( 'name' )] = $( input ).val();
			} );
		} );
		formData.username = payload.username;
		formData.password = payload.password;
		formData.userid = payload.username;
		formData.tenantDisplayName = payload.identitydomain;
		formData.tenantName = payload.identitydomain;

		const referer = response.request.uri.href.replace( response.request.uri.host, response.request.uri.hostname );

		console.log( '===========================================' );
		console.log( '===========================================' );
		console.log( formData );
		console.log( '===========================================' );
		console.log( payload.smartview.nexturl );
		console.log( payload.smartview.url );
		console.log( payload.smartview.planningurl );
		console.log( response.request.uri.href );
		console.log( '>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>' );
		console.log( '>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>' );
		console.log( response.request.uri.href );
		console.log( response.request.uri.href.replace( response.request.uri.host, response.request.uri.hostname ) );
		console.log( '>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>' );
		// tslint:disable-next-line:max-line-length
		// https://login.em2.oraclecloud.com/oam/server/obrareq.cgi?encquery%3DAgqPyBAfFvulPpurbKZYV1zf%2Fl55rpQadrfCpkKH%2F0Fz26rvnsgvPjdttnxoycSgNDVDLrDSB8%2FQrSKVb7qB4jiCHPmslbO2dJgB0KNWutKSa6RYVR296nPYue1jaTwcGTfY4fPjQtNqq4Cg9p3YagyouThmlvTh2xtOsO8tB1XMdGXxwfz1mHJmvXP5kJ9qpBoQ016GVzYhXxoS5TgAHfRWNeQjd8EUk95YCI72Ojb4yES%2BMkZ8sOPoWOObnQArE6P%2F6s5ERhtfw5ftspu1C3Gz4CTFV0FW6ykOpa4IcurdAVhSc37584p7Eh%2BVjH43FfkwzDmG6xhre6CL5WHnZhvh0FXC4jGefr6qSG09DFeXUTyJHepEniNn%2BBFZ4Gz8%20agentid%3DPlanning_WG%20ver%3D1%20crmethod%3D2
		console.log( '===========================================' );

		const { response: r } = await this.smartviewPoster( { url: payload.smartview.nexturl, form: formData, jar: payload.smartview.jar, referer } );
		await this.smartviewWaiter( payload );
		console.clear();
		console.log( '!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!' );
		// console.log( payload.smartview.jar.getCookies( 'planning7-kerzner.pbcs.em2.oraclecloud.com' ) );
		console.log( payload.smartview.jar.getCookies( payload.smartview.nexturl ) );
		// console.log( payload.smartview.jar );
		console.log( '!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!' );

		// const body = await this.smartviewGetXMLTemplate( 'req_ConnectToProvider.xml', {} );
		// const { body: rBody } = await this.smartviewPoster( { url: payload.smartview.url, jar: payload.smartview.jar, body, followRedirect: false } );

		// console.log( '===========================================' );
		// console.log( rBody );
		// console.log( '===========================================' );
		// console.log( r.statusCode );
		// console.log( '===========================================' );
		// console.log( payload.smartview.url );
		// console.log( '===========================================' );
		/*
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
		*/

		await this.smartviewWaiter( payload, 450000 );
		// console.log( ( new Date() ).toString() );
		// const browser = await puppeteer.launch( { headless: false } );
		// console.log( '>>> #Cookies:', 0, 'Browser initialized' );
		// const page = await browser.newPage();
		// let cookies = await page.cookies();
		// console.log( '>>> #Cookies:', cookies.length, 'Page created' );
		// await page.setViewport( { width: 1024, height: 768 } );
		// console.log( '>>> #Cookies:', cookies.length, 'Viewport is 1024x768 now' );
		// await page.goto( payload.smartview.url );
		// cookies = await page.cookies();
		// console.log( '>>> #Cookies:', cookies.length, 'We are at the form now' );
		// console.log( '>>> #Cookies:', cookies.length );
		// await page.screenshot( { path: 'screenshots/puppet-0001.png' } );
		// await page.type( '#username', payload.username );
		// await page.type( '#password', payload.password );
		// console.log( '>>> #Cookies:', cookies.length, 'Form is filled' );
		// await page.screenshot( { path: 'screenshots/puppet-0002.png' } );
		// await page.click( '#signin' );
		// console.log( '>>> #Cookies:', ( await page.cookies() ).length, 'We are at the form now' );
		// await page.waitForNavigation();
		// console.log( '>>> #Cookies:', ( await page.cookies() ).length, 'Waited for navigation' );
		// await page.screenshot( { path: 'screenshots/puppet-0003.png' } );
		// await browser.close();
		// console.log( ( new Date() ).toString() );
		throw new Error( 'Not yet' );
		return payload;
	}
	private pbcsObtainSIDold = ( payload: ATEnvironmentDetail ): Promise<ATEnvironmentDetail> => {
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
		console.log( payload.smartview.url );
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
		console.log( refInfo.refDetails.formFields );
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
	private smartviewRequester = ( options: ATSmartViewRequestOptions ): Promise<{ body: any, $: CheerioStatic, options: ATSmartViewRequestOptions, response: request.Response }> => {
		return new Promise( ( resolve, reject ) => {
			const requestOptions: any = {
				url: options.url,
				method: options.method,
				body: options.body,
				headers: { 'Content-Type': options.contentType || 'application/xml' },
				timeout: options.timeout || 120000,
				followRedirect: options.followRedirect === false ? false : true
			};
			if ( options.jar ) {
				requestOptions.jar = options.jar;
			} else if ( options.cookie ) {
				requestOptions.headers.cookie = options.cookie;
			}
			if ( options.referer ) requestOptions.headers.referer = options.referer;
			request( requestOptions, ( err: Error, response: request.Response, body: any ) => {
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
