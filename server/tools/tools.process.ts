import { DB } from './tools.db';
import { MainTools } from './tools.main';
import { ATProcess } from 'shared/models/at.process';
import { ATTuple } from '../../shared/models/at.tuple';

export class ProcessTool {
	constructor( private db: DB, private tools: MainTools ) { }

	public getAll = async (): Promise<ATProcess[]> => {
		const { tuples } = await this.db.query<ATTuple>( 'SELECT * FROM processes' );
		return tuples.map( t => this.tools.prepareTupleToRead<ATProcess>( t ) );
	}

	public getOne = async ( id: number ): Promise<ATProcess> => {
		const { tuple } = await this.db.queryOne<ATTuple>( 'SELECT * FROM processes WHERE id = ?', id );
		return this.tools.prepareTupleToRead<ATProcess>( tuple );
	}

	public create = async (): Promise<ATProcess> => {
		const newProcess = <ATProcess>{ name: 'New Process' };
		const { tuple } = await this.db.queryOne<any>( 'INSERT INTO processes SET ?', this.tools.prepareTupleToWrite( newProcess ) );
		newProcess.id = tuple.insertId;
		return newProcess;
	}

	public update = async ( payload: ATProcess ) => {
		await this.db.queryOne( 'UPDATE processes SET ? WHERE id = ?', [this.tools.prepareTupleToWrite( payload ), payload.id] );
	}

	public delete = async ( id: number ) => {
		await this.db.query( 'DELETE FROM processes WHERE id = ?', id );
	}
}
// import * as asynclib from 'async';
// import { Pool } from 'mysql';

// import { DimeEnvironment } from '../../shared/model/dime/environment';
// import { DimeMap } from '../../shared/model/dime/map';
// import { DimeProcess, DimeProcessStepType, DimeCartesianDefinitions } from '../../shared/model/dime/process';
// import { DimeProcessDefaultTarget } from '../../shared/model/dime/process';
// import { DimeProcessTransformation } from '../../shared/model/dime/process';
// import { DimeProcessRunning } from '../../shared/model/dime/process';
// import { DimeProcessStep } from '../../shared/model/dime/process';
// import { DimeProcessStepRunning, DimeProcessStatus } from '../../shared/model/dime/process';
// import { DimeStream } from '../../shared/model/dime/stream';
// import { DimeStreamField, DimeStreamFieldDetail } from '../../shared/model/dime/streamfield';
// import { DimeStreamType, dimeGetStreamTypeDescription } from '../../shared/enums/dime/streamtypes';
// import { EnvironmentTools } from './tools.dime.environment';
// import { MapTools } from './tools.dime.map';
// import { StreamTools } from './tools.dime.stream';
// import { ATLogger } from './tools.log';
// import { MailTool } from './tools.mailer';
// import { MainTools } from './tools.main';
// import { SettingsTool } from './tools.settings';
// import { DimeEnvironmentDetail } from '../../shared/model/dime/environmentDetail';
// import { DimeEnvironmentType } from '../../shared/enums/dime/environmenttypes';
// import { ATReadyStatus } from '../../shared/enums/generic/readiness';
// import { isNumeric, SortByPosition, getMonthSorterValue, verylongelementname, SortByVeryLongElementName } from '../../shared/utilities/utilityFunctions';
// import { DimeMatrixTool } from './tools.dime.matrix';
// import { DimeMatrix } from '../../shared/model/dime/matrix';
// import * as _ from 'lodash';
// import { DimeSetting } from '../../shared/model/dime/settings';

// const excel = require( 'exceljs' );
// const streamBuffers = require( 'stream-buffers' );
// export class ProcessTools {
// 	logTool: ATLogger;
// 	streamTool: StreamTools;
// 	environmentTool: EnvironmentTools;
// 	mapTool: MapTools;
// 	matrixTool: DimeMatrixTool;
// 	settingsTool: SettingsTool;
// 	mailTool: MailTool;

// 	constructor(
// 		public db: Pool,
// 		public tools: MainTools ) {
// 		this.logTool = new ATLogger( this.db, this.tools );
// 		this.streamTool = new StreamTools( this.db, this.tools );
// 		this.environmentTool = new EnvironmentTools( this.db, this.tools );
// 		this.mapTool = new MapTools( this.db, this.tools );
// 		this.matrixTool = new DimeMatrixTool( this.db, this.tools );
// 		this.settingsTool = new SettingsTool( this.db, this.tools );
// 		this.mailTool = new MailTool( this.db, this.tools );
// 	}

// 	public getAll = () => {
// 		return new Promise( ( resolve, reject ) => {
// 			this.db.query( 'SELECT * FROM processes', ( err, rows, fields ) => {
// 				if ( err ) {
// 					reject( { error: err, message: 'Failed to get processes.' } );
// 				} else {
// 					rows = rows.map( row => this.prepareOne( row ) );
// 					resolve( rows );
// 				}
// 			} );
// 		} );
// 	}
// 	public getOne = ( id: number ) => {
// 		return new Promise( ( resolve, reject ) => {
// 			this.db.query( 'SELECT * FROM processes WHERE id = ?', id, ( err, rows, fields ) => {
// 				if ( err ) {
// 					reject( { error: err, message: 'Failed to get process.' } );
// 				} else if ( rows.length !== 1 ) {
// 					reject( { error: 'Wrong number of records', message: 'Wrong number of records for process received from the server, 1 expected' } );
// 				} else {
// 					rows = rows.map( row => this.prepareOne( row ) );
// 					resolve( rows[0] );
// 				}
// 			} );
// 		} );
// 	}
// 	private prepareOne = ( payload: DimeProcess ) => {
// 		if ( payload.tags ) {
// 			payload.tags = JSON.parse( payload.tags );
// 		} else {
// 			payload.tags = {};
// 		}
// 		if ( !payload.status ) {
// 			payload.status = DimeProcessStatus.Ready;
// 		}
// 		return payload;
// 	}
// 	public update = ( dimeProcess: DimeProcess ) => {
// 		return new Promise( ( resolve, reject ) => {
// 			if ( !dimeProcess.steps ) {
// 				dimeProcess.steps = [];
// 			}
// 			this.stepUpdateAll( { processID: dimeProcess.id, steps: dimeProcess.steps } )
// 				.then( () => {
// 					delete dimeProcess.isPrepared;
// 					delete dimeProcess.issueList;
// 					delete dimeProcess.steps;
// 					delete dimeProcess.defaultTargets;
// 					delete dimeProcess.filters;
// 					delete dimeProcess.filtersDataFile;
// 					dimeProcess.tags = JSON.stringify( dimeProcess.tags );
// 					this.db.query( 'UPDATE processes SET ? WHERE id = ?', [dimeProcess, dimeProcess.id], ( err, rows, fields ) => {
// 						if ( err ) {
// 							reject( err );
// 						} else {
// 							resolve( dimeProcess );
// 						}
// 					} );
// 				} )
// 				.catch( reject );
// 		} );
// 	}
// 	public delete = ( id: number ) => {
// 		return new Promise( ( resolve, reject ) => {
// 			this.stepClear( id ).
// 				then( () => {
// 					this.db.query( 'DELETE FROM processes WHERE id = ?', id, ( err, rows, fields ) => {
// 						if ( err ) {
// 							reject( { error: err, message: 'Failed to delete the process.' } );
// 						} else {
// 							resolve( id );
// 						}
// 					} );
// 				} ).
// 				catch( reject );
// 		} );
// 	}
// 	public create = () => {
// 		return new Promise( ( resolve, reject ) => {
// 			let newProcess: { id?: number, name: string };
// 			newProcess = { name: 'New Process' };
// 			this.db.query( 'INSERT INTO processes SET ?', newProcess, ( err, rows, fields ) => {
// 				if ( err ) {
// 					reject( { error: err, message: 'Failed to create a new process.' } );
// 				} else {
// 					newProcess.id = rows.insertId;
// 					const s1 = <DimeProcessStep>{}; s1.position = 1; s1.process = newProcess.id; s1.type = DimeProcessStepType.SourceProcedure;
// 					const s2 = <DimeProcessStep>{}; s2.position = 2; s2.process = newProcess.id; s2.type = DimeProcessStepType.PullData;
// 					const s3 = <DimeProcessStep>{}; s3.position = 3; s3.process = newProcess.id; s3.type = DimeProcessStepType.MapData;
// 					const s4 = <DimeProcessStep>{}; s4.position = 4; s4.process = newProcess.id; s4.type = DimeProcessStepType.PushData;
// 					const s5 = <DimeProcessStep>{}; s5.position = 5; s5.process = newProcess.id; s5.type = DimeProcessStepType.TargetProcedure;
// 					this.stepCreate( s1 )
// 						.then( () => this.stepCreate( s2 ) )
// 						.then( () => this.stepCreate( s3 ) )
// 						.then( () => this.stepCreate( s4 ) )
// 						.then( () => this.stepCreate( s5 ) )
// 						.then( () => {
// 							resolve( newProcess );
// 						} )
// 						.catch( reject );
// 				}
// 			} );
// 		} );
// 	}
// 	public stepCreate = ( step: DimeProcessStep ) => {
// 		return new Promise( ( resolve, reject ) => {
// 			this.stepGetMaxOrder( step.process ).
// 				then( ( curMax ) => {
// 					step.position = ++curMax;
// 					delete step.id;
// 					this.db.query( 'INSERT INTO processsteps SET ?', step, ( err, rows, fields ) => {
// 						if ( err ) {
// 							reject( err );
// 						} else {
// 							resolve( rows );
// 						}
// 					} );
// 				} ).catch( reject );
// 		} );
// 	}
// 	public stepGetOne = ( id: number ): Promise<DimeProcessStep> => {
// 		return new Promise( ( resolve, reject ) => {
// 			this.db.query( 'SELECT * FROM processsteps WHERE id = ?', id, ( err, rows: DimeProcessStep[], fields ) => {
// 				if ( err ) {
// 					reject( err );
// 				} else if ( rows.length !== 1 ) {
// 					reject( new Error( 'Step is not found' ) );
// 				} else {
// 					rows.map( ( curStep ) => {
// 						return this.stepPrepareToGet( curStep );
// 					} );
// 					resolve( rows[0] );
// 				}
// 			} );
// 		} );
// 	}
// 	public stepLoadAll = ( id: number ): Promise<DimeProcessStep[]> => {
// 		return new Promise( ( resolve, reject ) => {
// 			this.getOne( id )
// 				.then( ( process: DimeProcess ) => {
// 					this.db.query( 'SELECT * FROM processsteps WHERE process = ? ORDER BY position', id, ( err, rows: DimeProcessStep[], fields ) => {
// 						if ( err ) {
// 							reject( err );
// 						} else {
// 							rows.map( ( curStep, curIndex ) => {
// 								curStep = this.stepPrepareToGet( curStep );
// 								curStep.position = curIndex + 1;
// 								if ( curStep.type === DimeProcessStepType.SourceProcedure && !curStep.referedid ) { curStep.referedid = process.source; }
// 								if ( curStep.type === DimeProcessStepType.TargetProcedure && !curStep.referedid ) { curStep.referedid = process.target; }
// 								return curStep;
// 							} );
// 							resolve( rows );
// 						}
// 					} );
// 				} )
// 				.catch( reject );
// 		} );
// 	}
// 	private stepPrepareToGet = ( step: DimeProcessStep ): DimeProcessStep => {
// 		if ( step.details ) { step.details = step.details.toString(); }
// 		try {
// 			step.detailsObject = JSON.parse( step.details );
// 		} catch ( error ) {
// 			step.detailsObject = {};
// 		}
// 		if ( !step.detailsObject ) {
// 			step.detailsObject = {};
// 			if ( step.type === DimeProcessStepType.SendData ) { step.detailsObject = []; }
// 			if ( step.type === DimeProcessStepType.SendLogs ) { step.detailsObject = []; }
// 			if ( step.type === DimeProcessStepType.SendMissingMaps ) { step.detailsObject = []; }
// 			if ( step.type === DimeProcessStepType.TransformData ) { step.detailsObject = []; }
// 		}
// 		return step;
// 	}
// 	private stepPrepareToSave = ( step: DimeProcessStep ): DimeProcessStep => {
// 		if ( step.detailsObject && step.type !== DimeProcessStepType.SourceProcedure ) {
// 			step.details = JSON.stringify( step.detailsObject );
// 		}
// 		delete step.detailsObject;
// 		return step;
// 	}
// 	public stepUpdateAll = ( refObj: { processID: number, steps: any[] } ) => {
// 		let promises: any[]; promises = [];
// 		refObj.steps.forEach( ( curStep ) => {
// 			promises.push( this.stepUpdate( curStep ) );
// 		} );
// 		return Promise.all( promises );
// 	}
// 	private stepGetMaxOrder = ( id?: number ): Promise<number> => {
// 		return new Promise( ( resolve, reject ) => {
// 			if ( !id ) {
// 				reject( new Error( 'No process id is given' ) );
// 			} else {
// 				this.db.query( 'SELECT IFNULL(MAX(position),0) AS maxOrder FROM processsteps WHERE process = ?', id, ( err, rows, fields ) => {
// 					if ( err ) {
// 						reject( err );
// 					} else {
// 						resolve( rows[0].maxOrder );
// 					}
// 				} );
// 			}
// 		} );
// 	}
// 	private stepClear = ( id: number ) => {
// 		return new Promise( ( resolve, reject ) => {
// 			this.db.query( 'DELETE FROM processsteps WHERE process = ?', id, ( err, rows, fields ) => {
// 				if ( err ) {
// 					reject( err );
// 				} else {
// 					resolve();
// 				}
// 			} );
// 		} );
// 	}
// 	public stepDelete = ( id: number ) => {
// 		return new Promise( ( resolve, reject ) => {
// 			let curStep: DimeProcessStep;
// 			this.stepGetOne( id ).then( ( sStep ) => { curStep = sStep; return this.stepRemoveAction( id ); } ).
// 				then( () => this.stepLoadAll( curStep.process ) ).
// 				then( ( allSteps ) => {
// 					let promises: Promise<any>[]; promises = [];
// 					allSteps.forEach( ( sStep: DimeProcessStep, curKey: number ) => {
// 						sStep.position = curKey + 1;
// 						promises.push( this.stepUpdate( sStep ) );
// 					} );
// 					return Promise.all( promises );
// 				} ).
// 				then( resolve ).
// 				catch( reject );

// 		} );
// 	}
// 	private stepRemoveAction = ( id: number ) => {
// 		return new Promise( ( resolve, reject ) => {
// 			this.db.query( 'DELETE FROM processsteps WHERE id = ?', id, ( err, rows, fields ) => {
// 				if ( err ) {
// 					reject( err );
// 				} else {
// 					resolve( 'OK' );
// 				}
// 			} );
// 		} );
// 	}
// 	public stepUpdate = ( step: DimeProcessStep ): Promise<DimeProcessStep> => {
// 		return new Promise( ( resolve, reject ) => {
// 			if ( !step ) {
// 				reject( 'Empty body is not accepted' );
// 			} else {
// 				step = this.stepPrepareToSave( step );
// 				this.db.query( 'UPDATE processsteps SET ? WHERE id = ?', [step, step.id], ( err, rows, fields ) => {
// 					if ( err ) {
// 						reject( err );
// 					} else {
// 						resolve( step );
// 					}
// 				} );
// 			}
// 		} );
// 	}
// 	public isPrepared = ( id: number ) => {
// 		return new Promise( ( resolve, reject ) => {
// 			let isPrepared: ATReadyStatus = ATReadyStatus.Ready;
// 			let issueArray: string[]; issueArray = [];
// 			this.getOne( id ).
// 				then( ( innerObj: DimeProcess ) => {
// 					if ( !innerObj.source ) { isPrepared = ATReadyStatus.NotReady; issueArray.push( 'Process does not have a source environment defined' ); }
// 					if ( !innerObj.target ) { isPrepared = ATReadyStatus.NotReady; issueArray.push( 'Process does not have a target environment defined' ); }
// 					return this.stepLoadAll( id );
// 				} ).
// 				then( ( stepList ) => {
// 					let srcprocedureOrder = 0, pulldataOrder = 0, mapdataOrder = 0, pushdataOrder = 0;
// 					let transformOrder = 0, tarprocedureOrder = 0, sendlogsOrder = 0, senddataOrder = 0, sendmissingOrder = 0;
// 					stepList.forEach( ( curStep ) => {
// 						if ( curStep.type === DimeProcessStepType.SourceProcedure && curStep.position ) { srcprocedureOrder = curStep.position; }
// 						if ( curStep.type === DimeProcessStepType.PullData && curStep.position ) { pulldataOrder = curStep.position; }
// 						if ( curStep.type === DimeProcessStepType.MapData && curStep.position ) { mapdataOrder = curStep.position; }
// 						if ( curStep.type === DimeProcessStepType.PushData && curStep.position ) { pushdataOrder = curStep.position; }
// 						if ( curStep.type === DimeProcessStepType.TransformData && curStep.position ) { transformOrder = curStep.position; }
// 						if ( curStep.type === DimeProcessStepType.TargetProcedure && curStep.position ) { tarprocedureOrder = curStep.position; }
// 						if ( curStep.type === DimeProcessStepType.SendLogs && curStep.position ) { sendlogsOrder = curStep.position; }
// 						if ( curStep.type === DimeProcessStepType.SendData && curStep.position ) { senddataOrder = curStep.position; }
// 						if ( curStep.type === DimeProcessStepType.SendMissingMaps && curStep.position ) { sendmissingOrder = curStep.position; }
// 					} );

// 					if ( pulldataOrder >= mapdataOrder ) { isPrepared = ATReadyStatus.NotReady; issueArray.push( 'Please re-order the steps. Pull Data step should be assigned before map data.' ); }
// 					if ( mapdataOrder >= pushdataOrder ) { isPrepared = ATReadyStatus.NotReady; issueArray.push( 'Please re-order the steps. Map Data step should be assigned before push data.' ); }
// 					if ( transformOrder >= pushdataOrder ) { isPrepared = ATReadyStatus.NotReady; issueArray.push( 'Please re-order the steps. Transform Data step should be assigned before push data.' ); }

// 					resolve( { isPrepared: isPrepared, issueList: issueArray } );
// 				} ).
// 				catch( reject );
// 		} );
// 	}
// 	public fetchDefaults = ( id: number ) => {
// 		return new Promise( ( resolve, reject ) => {
// 			this.db.query( 'SELECT * FROM processdefaulttargets WHERE process = ?', id, ( err, rows, fields ) => {
// 				if ( err ) {
// 					reject( err );
// 				} else {
// 					resolve( rows );
// 				}
// 			} );
// 		} );
// 	}
// 	public applyDefaults = ( payload: { processID: number, defaults: any } ) => {
// 		return new Promise( ( resolve, reject ) => {
// 			this.clearDefaults( payload.processID ).
// 				then( this.getOne ).
// 				then( ( innerObj: DimeProcess ) => {
// 					let promises: any[]; promises = [];
// 					Object.keys( payload.defaults ).forEach( ( curKey ) => {
// 						promises.push( this.applyDefault( { process: payload.processID, field: curKey, value: payload.defaults[curKey] } ) );
// 					} );
// 					return Promise.all( promises );
// 				} ).
// 				then( resolve ).
// 				catch( reject );
// 		} );
// 	}
// 	public applyDefault = ( curDefault: { process: number, field: string, value: string } ) => {
// 		return new Promise( ( resolve, reject ) => {
// 			if ( curDefault.value ) {
// 				this.db.query( 'INSERT INTO processdefaulttargets SET ?', curDefault, ( err, rows, fields ) => {
// 					if ( err ) {
// 						reject( err );
// 					} else {
// 						resolve( 'OK' );
// 					}
// 				} );
// 			} else {
// 				resolve( 'OK' );
// 			}
// 		} );
// 	}

// 	public clearDefaults = ( id: number ) => {
// 		return new Promise( ( resolve, reject ) => {
// 			this.db.query( 'DELETE FROM processdefaulttargets WHERE process = ?', id, ( err, rows, fields ) => {
// 				if ( err ) {
// 					reject( err );
// 				} else {
// 					resolve( id );
// 				}
// 			} );
// 		} );
// 	}
// 	public applyFilters = ( payload: { id: number, filters: any } ) => {
// 		return new Promise( ( resolve, reject ) => {
// 			if ( !payload ) {
// 				reject( new Error( 'Object does not exist' ) );
// 			} else if ( !payload.id ) {
// 				reject( new Error( 'Object does not provide process id.' ) );
// 			} else if ( !payload.filters ) {
// 				reject( new Error( 'Object does not provide filter list.' ) );
// 			} else {
// 				Object.keys( payload.filters ).forEach( filter => {
// 					payload.filters[filter].process = payload.id;
// 				} );
// 				let filters: any[] = Object.keys( payload.filters ).map( item => payload.filters[item] );
// 				filters = filters.filter( item => ( item.filterfrom || item.filterto || item.filtertext || item.filterbeq || item.filterseq ) );
// 				const idsToKeep = filters.map( item => item.id ).filter( item => item );

// 				this.clearFilters( payload.id, idsToKeep ).
// 					then( () => {
// 						let promises: any[]; promises = [];
// 						filters.forEach( ( curFilter: any ) => {
// 							promises.push( this.applyFilter( curFilter ) );
// 						} );
// 						return Promise.all( promises );
// 					} ).
// 					then( resolve ).
// 					catch( reject );
// 			}
// 		} );
// 	}
// 	public applyFilter = ( curFilter: any ) => {
// 		return new Promise( ( resolve, reject ) => {
// 			let query = '';
// 			if ( curFilter.id ) {
// 				query = 'UPDATE processfilters SET ? WHERE id = ' + curFilter.id;
// 			} else {
// 				query = 'INSERT INTO processfilters SET ?';
// 			}
// 			this.db.query( query, curFilter, ( err, rows, fields ) => {
// 				if ( err ) {
// 					reject( err );
// 				} else {
// 					resolve( 'OK' );
// 				}
// 			} );
// 		} );
// 	}
// 	public clearFilters = ( id: number, listToExclude: number[] ) => {
// 		// If an empty list is received, we don't fail this way
// 		listToExclude.push( 0 );
// 		return new Promise( ( resolve, reject ) => {
// 			this.db.query( 'DELETE FROM processfilters WHERE process = ? AND id NOT IN (' + listToExclude.join( ',' ) + ')', id, ( err, rows, fields ) => {
// 				if ( err ) {
// 					reject( err );
// 				} else {
// 					resolve( id );
// 				}
// 			} );
// 		} );
// 	}
// 	public applyFiltersDataFile = ( payload: { id: number, filters: any } ) => {
// 		return new Promise( ( resolve, reject ) => {
// 			if ( !payload ) {
// 				reject( 'Object does not exist' );
// 			} else if ( !payload.id ) {
// 				reject( 'Object does not provide process id.' );
// 			} else if ( !payload.filters ) {
// 				reject( 'Object does not provide filter list.' );
// 			} else {
// 				const filters: any[] = Object.keys( payload.filters )
// 					.map( item => ( { process: payload.id, ...payload.filters[item] } ) )
// 					.filter( item => ( item.filterfrom || item.filterto || item.filtertext || item.filterbeq || item.filterseq ) );
// 				const idsToKeep = filters.map( item => item.id ).filter( item => item );
// 				this.clearFiltersDataFile( payload.id, idsToKeep ).
// 					then( () => {
// 						let promises: any[]; promises = [];
// 						filters.forEach( ( curFilter: any ) => {
// 							promises.push( this.applyFilterDataFile( curFilter ) );
// 						} );
// 						return Promise.all( promises );
// 					} ).
// 					then( resolve ).
// 					catch( reject );
// 			}
// 		} );
// 	}
// 	public applyFilterDataFile = ( curFilter: any ) => {
// 		return new Promise( ( resolve, reject ) => {
// 			let query = '';
// 			if ( curFilter.id ) {
// 				query = 'UPDATE processfiltersdatafile SET ? WHERE id = ' + curFilter.id;
// 			} else {
// 				query = 'INSERT INTO processfiltersdatafile SET ?';
// 			}
// 			this.db.query( query, curFilter, ( err, rows, fields ) => {
// 				if ( err ) {
// 					reject( err );
// 				} else {
// 					resolve( 'OK' );
// 				}
// 			} );
// 		} );
// 	}
// 	public clearFiltersDataFile = ( id: number, listToExclude: number[] ) => {
// 		// If an empty list is received, we don't fail this way
// 		listToExclude.push( 0 );
// 		return new Promise( ( resolve, reject ) => {
// 			this.db.query( 'DELETE FROM processfiltersdatafile WHERE process = ? AND id NOT IN (' + listToExclude.join( ',' ) + ')', id, ( err, rows, fields ) => {
// 				if ( err ) {
// 					reject( err );
// 				} else {
// 					resolve( id );
// 				}
// 			} );
// 		} );
// 	}
// 	public fetchFilters = ( id: number ) => {
// 		return new Promise( ( resolve, reject ) => {
// 			let theQuery: string; theQuery = '';
// 			theQuery += 'SELECT id, process, stream, field,';
// 			theQuery += 'DATE_FORMAT(filterfrom, \'%Y-%m-%d\') AS filterfrom,';
// 			theQuery += 'DATE_FORMAT(filterto, \'%Y-%m-%d\') AS filterto,';
// 			theQuery += 'filtertext, filterbeq, filterseq FROM processfilters WHERE process = ?';
// 			this.db.query( theQuery, id, ( err, rows, fields ) => {
// 				if ( err ) {
// 					reject( err );
// 				} else {
// 					resolve( rows );
// 				}
// 			} );
// 		} );
// 	}
// 	public fetchFiltersDataFile = ( id: number ) => {
// 		return new Promise( ( resolve, reject ) => {
// 			let theQuery: string; theQuery = '';
// 			theQuery += 'SELECT id, process, stream, field,';
// 			theQuery += 'DATE_FORMAT(filterfrom, \'%Y-%m-%d\') AS filterfrom,';
// 			theQuery += 'DATE_FORMAT(filterto, \'%Y-%m-%d\') AS filterto,';
// 			theQuery += 'filtertext, filterbeq, filterseq FROM processfiltersdatafile WHERE process = ?';
// 			this.db.query( theQuery, id, ( err, rows, fields ) => {
// 				if ( err ) {
// 					reject( err );
// 				} else {
// 					resolve( rows );
// 				}
// 			} );
// 		} );
// 	}
// 	private setStatus = ( id: number, status: DimeProcessStatus ) => {
// 		return new Promise( ( resolve, reject ) => {
// 			this.db.query( 'UPDATE processes SET status = ? WHERE id = ?', [status, id], ( err, result, fields ) => {
// 				if ( err ) {
// 					reject( err );
// 				} else {
// 					resolve( id );
// 				}
// 			} );
// 		} );
// 	}
// 	public unlock = ( id: number ) => {
// 		return this.setStatus( id, DimeProcessStatus.Ready );
// 	}
// 	public runAndWait = ( id: number ) => {
// 		return new Promise( ( resolve, reject ) => {
// 			this.run( id ).
// 				then( ( result: DimeProcessRunning ) => {
// 					return this.runAndWaitWait( result.currentlog );
// 				} ).
// 				then( resolve ).
// 				catch( reject );
// 		} );
// 	}
// 	private runAndWaitWait = ( logid: number ) => {
// 		return new Promise( ( resolve, reject ) => {
// 			this.logTool.checkLog( logid ).
// 				then( ( result: any ) => {
// 					if ( result.start.toString() === result.end.toString() ) {
// 						setTimeout( () => {
// 							resolve( this.runAndWaitWait( logid ) );
// 						}, 2000 );
// 					} else {
// 						resolve();
// 					}
// 				} ).
// 				catch( reject );
// 		} );
// 	}
// 	public run = ( id: number ) => {
// 		return new Promise( ( resolve, reject ) => {
// 			this.getOne( id ).
// 				then( this.setInitiated ).
// 				then( ( process ) => {
// 					if ( process.id && process.name && process.source && process.target && process.status === DimeProcessStatus.Running && process.currentlog > 0 ) {
// 						this.runAction( process );
// 						resolve( process );
// 					} else {
// 						reject( 'Process is not ready' );
// 						this.unlock( process.id );
// 					}
// 				} ).catch( reject );
// 		} );
// 	}
// 	private runAction = ( refProcess: DimeProcessRunning ) => {
// 		return new Promise( ( resolve, reject ) => {
// 			this.identifySteps( refProcess ).
// 				then( this.identifyStreams ).
// 				then( this.identifyEnvironments ).
// 				then( this.isReady ).
// 				then( this.createTables ).
// 				then( this.fetchFiltersToRefProcess ).
// 				then( this.runSteps ).
// 				then( this.setCompleted ).
// 				then( resolve ).
// 				catch( ( issue ) => {
// 					console.error( issue );
// 					this.logTool.appendLog( refProcess.currentlog, 'Failed: ' + issue ).
// 						then( () => {
// 							const toLogProcess = <DimeProcessRunning>{};
// 							toLogProcess.id = refProcess.id;
// 							toLogProcess.name = refProcess.name;
// 							toLogProcess.status = refProcess.status;
// 							toLogProcess.erroremail = refProcess.erroremail;
// 							toLogProcess.currentlog = refProcess.currentlog;
// 							return this.sendLogFile( toLogProcess, true );
// 						} ).
// 						then( () => {
// 							this.setCompleted( refProcess );
// 						} ).catch( ( fatalIssue ) => {
// 							console.log( 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx' );
// 							console.log( 'xxxxxx Fatal Issue xxxxxxxxxxxxxxxxxxxxxxxx' );
// 							console.log( 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx' );
// 							console.log( fatalIssue );
// 							console.log( 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx' );
// 							console.log( 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx' );
// 							this.setCompleted( refProcess );
// 						} );
// 				} );
// 		} );
// 	}
// 	private runSteps = ( refProcess: DimeProcessRunning ) => {
// 		this.logTool.appendLog( refProcess.currentlog, 'Preparation is now complete. Process will run steps now.' );
// 		return this.runStepsAction( refProcess );
// 	}
// 	private runStepsAction = ( refProcess: DimeProcessRunning ) => {
// 		return new Promise( ( resolve, reject ) => {
// 			if ( refProcess.steps.length === 0 ) {
// 				this.logTool.appendLog( refProcess.currentlog, 'Warning: There are no steps to be run.' );
// 				resolve( refProcess );
// 			} else {
// 				let isStepAssigned = false;
// 				let curStep = <DimeProcessStepRunning>{ isPending: true };
// 				refProcess.steps.forEach( ( fStep ) => {
// 					if ( !isStepAssigned && fStep.isPending ) {
// 						curStep = fStep;
// 						refProcess.curStep = curStep.position;
// 						isStepAssigned = true;
// 					}
// 				} );
// 				if ( isStepAssigned ) {
// 					let logText = 'Running step: ' + curStep.position + ', step type: ' + curStep.type;
// 					if ( curStep.referedid > 0 ) { logText += ', reference id: ' + curStep.referedid; }
// 					this.logTool.appendLog( refProcess.currentlog, logText ).
// 						then( () => {

// 							switch ( curStep.type ) {
// 								case DimeProcessStepType.SourceProcedure: {
// 									this.runSourceProcedure( refProcess, curStep ).then( ( result: any ) => { curStep.isPending = false; resolve( this.runStepsAction( refProcess ) ); } ).catch( reject );
// 									// curStep.isPending = false; resolve( this.runStepsAction( refProcess ) );
// 									break;
// 								}
// 								case DimeProcessStepType.PullData: {
// 									this.runPullData( refProcess, curStep ).then( ( result: any ) => { curStep.isPending = false; resolve( this.runStepsAction( refProcess ) ); } ).catch( reject );
// 									// curStep.isPending = false; resolve( this.runStepsAction( refProcess ) );
// 									break;
// 								}
// 								case DimeProcessStepType.MapData: {
// 									if ( !refProcess.mapList ) {
// 										refProcess.mapList = [];
// 									}
// 									refProcess.mapList.push( curStep.referedid );
// 									this.runMapData( refProcess, curStep ).then( ( result: any ) => { curStep.isPending = false; resolve( this.runStepsAction( refProcess ) ); } ).catch( reject );
// 									// curStep.isPending = false; resolve( this.runStepsAction( refProcess ) );
// 									break;
// 								}
// 								case DimeProcessStepType.TransformData: {
// 									this.runTransformations( refProcess, curStep ).then( ( result: any ) => { curStep.isPending = false; resolve( this.runStepsAction( refProcess ) ); } ).catch( reject );
// 									// curStep.isPending = false; resolve( this.runStepsAction( refProcess ) );
// 									break;
// 								}
// 								case DimeProcessStepType.ValidateData: {
// 									this.runValidation( refProcess, curStep ).then( ( result: any ) => { curStep.isPending = false; resolve( this.runStepsAction( refProcess ) ); } ).catch( reject );
// 									// curStep.isPending = false; resolve( this.runStepsAction( refProcess ) );
// 									break;
// 								}
// 								case DimeProcessStepType.PushData: {
// 									this.runPushData( refProcess, curStep ).then( ( result: any ) => { curStep.isPending = false; resolve( this.runStepsAction( refProcess ) ); } ).catch( reject );
// 									// curStep.isPending = false; resolve( this.runStepsAction( refProcess ) );
// 									break;
// 								}
// 								case DimeProcessStepType.TargetProcedure: {
// 									this.runTargetProcedure( refProcess, curStep ).then( ( result: any ) => { curStep.isPending = false; resolve( this.runStepsAction( refProcess ) ); } ).catch( reject );
// 									// curStep.isPending = false; resolve( this.runStepsAction( refProcess ) );
// 									break;
// 								}
// 								case DimeProcessStepType.SendData: {
// 									this.runSendData( refProcess, curStep ).then( ( result: any ) => { curStep.isPending = false; resolve( this.runStepsAction( refProcess ) ); } ).catch( reject );
// 									// curStep.isPending = false; resolve( this.runStepsAction( refProcess ) );
// 									break;
// 								}
// 								case DimeProcessStepType.SendMissingMaps: {
// 									this.runSendMissing( refProcess, curStep ).then( ( result: any ) => { curStep.isPending = false; resolve( this.runStepsAction( refProcess ) ); } ).catch( reject );
// 									// curStep.isPending = false; resolve( this.runStepsAction( refProcess ) );
// 									break;
// 								}
// 								case DimeProcessStepType.SendLogs: {
// 									this.runSendLog( refProcess, curStep ).then( ( result: any ) => { curStep.isPending = false; resolve( this.runStepsAction( refProcess ) ); } ).catch( reject );
// 									// curStep.isPending = false; resolve( this.runStepsAction( refProcess ) );
// 									break;
// 								}
// 								default: {
// 									reject( new Error( 'This is not a known step type (' + curStep.type + ')' ) );
// 								}
// 							}
// 						} ).
// 						catch( reject );
// 				} else {
// 					this.logTool.appendLog( refProcess.currentlog, 'All steps are now completed.' );
// 					resolve( refProcess );
// 				}
// 			}
// 		} );
// 	}
// 	private runValidation = ( process: DimeProcessRunning, step: DimeProcessStepRunning ) => {
// 		return new Promise( ( resolve, reject ) => {
// 			this.runValidationPrepare( process.id, step.referedid )
// 				.then( () => this.runValidationAction( process, step ) )
// 				.then( () => this.runValidationMarkInvalids( process, step ) )
// 				.then( resolve )
// 				.catch( reject );
// 		} );
// 	}
// 	private runValidationMarkInvalids = ( process: DimeProcessRunning, step: DimeProcessStepRunning ) => {
// 		return new Promise( ( resolve, reject ) => {
// 			const promises: any[] = [];
// 			process.steps.filter( s => s.type === DimeProcessStepType.ValidateData ).forEach( s => {
// 				promises.push( new Promise( ( iresolve, ireject ) => {
// 					const updateQuery = 'UPDATE PROCESS' + process.id + '_DATATBL SET Matrix_' + s.referedid + '_Result = \'invalid\' WHERE Matrix_' + s.referedid + '_Result IS NULL';
// 					this.db.query( updateQuery, ( err, result ) => {
// 						if ( err ) {
// 							ireject( err );
// 						} else {
// 							iresolve();
// 						}
// 					} );
// 				} ) );
// 			} );
// 			Promise.all( promises ).then( () => {
// 				resolve();
// 			} ).catch( reject );
// 		} );
// 	}
// 	private runValidationAction = ( process: DimeProcessRunning, step: DimeProcessStepRunning ) => {
// 		return new Promise( ( resolve, reject ) => {
// 			this.matrixTool.getOne( step.referedid ).then( ( matrix: DimeMatrix ) => {
// 				const fieldsToCheck: string[] = [];
// 				process.targetStreamFields
// 					.filter( streamField => matrix.fields[streamField.id] )
// 					.forEach( streamField => {
// 						fieldsToCheck.push( streamField.name );
// 					} );
// 				let query = 'UPDATE PROCESS' + process.id + '_DATATBL DT, MATRIX' + step.referedid + '_MATRIXTBL MT SET DT.Matrix_' + step.referedid + '_Result = \'valid\' WHERE ';
// 				query += fieldsToCheck.map( field => 'DT.TAR_' + field + ' = MT.' + field ).join( ' AND ' );
// 				if ( process.wherersWithSrc.length > 0 ) {
// 					query += '\n AND ' + process.wherersWithSrc.map( wherer => 'DT.' + wherer ).join( ' AND ' );
// 				}
// 				this.db.query( query, ( err, result ) => {
// 					if ( err ) {
// 						reject( err );
// 					} else {
// 						resolve();
// 					}
// 				} );
// 			} ).catch( reject );
// 		} );
// 	}
// 	private runValidationPrepare = ( processid: number, matrixid: number ) => {
// 		return new Promise( ( resolve, reject ) => {
// 			this.db.query( 'DESC PROCESS' + processid + '_DATATBL', ( err, result, fields ) => {
// 				if ( err ) {
// 					reject( err );
// 				} else {
// 					const doWeHave: boolean = ( result.filter( tuple => tuple.Field === 'Matrix_' + matrixid + '_Result' ).length > 0 );
// 					if ( doWeHave ) {
// 						resolve( processid );
// 					} else {
// 						resolve( this.runValidationAddColumn( processid, matrixid ) );
// 					}
// 				}
// 			} );
// 		} );
// 	}
// 	private runValidationAddColumn = ( processid: number, matrixid: number ) => {
// 		return new Promise( ( resolve, reject ) => {
// 			this.db.query( 'ALTER TABLE PROCESS' + processid + '_DATATBL ADD Matrix_' + matrixid + '_Result VARCHAR(7) NULL', ( err, result ) => {
// 				if ( err ) {
// 					reject( err );
// 				} else {
// 					resolve( processid );
// 				}
// 			} );
// 		} );
// 	}
// 	private runSendMissing = ( refProcess: DimeProcessRunning, refStep: DimeProcessStepRunning ) => {
// 		refProcess.recepients = refStep.detailsObject.map( recepient => recepient.address ).join( ', ' );
// 		return new Promise( ( resolve, reject ) => {
// 			this.logTool.appendLog( refProcess.currentlog, 'Step ' + refStep.position + ': Send missing maps.' ).
// 				then( () => this.sendMissingPrepareAll( refProcess, refStep ) ).
// 				then( ( result ) => this.sendMissingCreateFile( result ) ).
// 				then( ( result ) => this.sendMissingSendFile( refProcess, refStep, result ) ).
// 				then( resolve ).
// 				catch( reject );
// 		} );
// 	}
// 	private sendMissingPrepareAll = ( refProcess: DimeProcessRunning, refStep: DimeProcessStepRunning ) => {
// 		let promises: any[]; promises = [];
// 		refProcess.mapList.forEach( ( mapID ) => {
// 			promises.push( this.sendMissingPrepareOne( refProcess, refStep, mapID ) );
// 		} );
// 		return Promise.all( promises );
// 	}
// 	private sendMissingPrepareOne = ( refProcess: DimeProcessRunning, refStep: DimeProcessStepRunning, mapID: number ) => {
// 		return new Promise( ( resolve, reject ) => {
// 			let masterMap: DimeMap;
// 			this.mapTool.getOne( mapID ).
// 				then( ( curMap: DimeMap ) => {
// 					masterMap = curMap;
// 					if ( curMap.matrix ) {
// 						return this.matrixTool.getOne( curMap.matrix );
// 					} else {
// 						return Promise.resolve( <DimeMatrix>{} );
// 					}
// 				} ).
// 				then( ( matrix ) => this.sendMissingPrepareQuery( refProcess, refStep, masterMap, matrix ) ).
// 				then( ( curQuery: string ) => this.sendMissingRunQuery( curQuery, masterMap ) ).
// 				then( resolve ).
// 				catch( reject );
// 		} );
// 	}
// 	private sendMissingPrepareQuery = ( process: DimeProcessRunning, step: DimeProcessStepRunning, map: DimeMap, matrix: DimeMatrix ) => {
// 		return new Promise( ( resolve, reject ) => {
// 			this.mapTool.getFields( map.id ).
// 				then( ( mapFields: any[] ) => {
// 					let mapFieldList: any[]; mapFieldList = [];
// 					mapFields.forEach( curMapField => {
// 						if ( curMapField.srctar === 'source' ) {
// 							process.sourceStreamFields
// 								.filter( f => f.name === curMapField.name )
// 								.forEach( f => {
// 									mapFieldList.push( { id: f.id, name: f.name, srctar: 'source', type: 'main', streamid: f.stream, position: f.position } );
// 									if ( f.isDescribed ) {
// 										mapFieldList.push( { id: f.id, name: f.name, srctar: 'source', type: 'description', streamid: f.stream, position: f.position } );
// 									}
// 								} );
// 						}
// 						if ( curMapField.srctar === 'target' ) {
// 							process.targetStreamFields
// 								.filter( f => f.name === curMapField.name )
// 								.forEach( f => {
// 									mapFieldList.push( { id: f.id, name: f.name, srctar: 'target', type: 'main', streamid: f.stream, position: f.position } );
// 									if ( f.isDescribed ) {
// 										mapFieldList.push( { id: f.id, name: f.name, srctar: 'target', type: 'description', streamid: f.stream, position: f.position } );
// 									}
// 								} );
// 						}
// 					} );
// 					mapFieldList.forEach( ( f ) => {
// 						f.position = parseInt( f.position, 10 ) * 100;
// 						if ( f.srctar === 'source' ) { f.position += 1000000; }
// 						if ( f.srctar === 'target' ) { f.position += 2000000; }
// 						if ( f.type === 'main' ) { f.position += 1; }
// 						if ( f.type === 'description' ) { f.position += 2; }
// 					} );
// 					mapFieldList.sort( SortByPosition );
// 					const selects: string[] = [];
// 					mapFieldList.forEach( f => {
// 						if ( f.srctar === 'source' ) { f.name = 'SRC_' + f.name; }
// 						if ( f.srctar === 'target' ) { f.name = 'TAR_' + f.name; }
// 						if ( f.type === 'description' ) { f.onField = f.name; }
// 						if ( f.type === 'description' ) { f.name = 'Description'; }
// 						if ( f.type === 'main' ) { f.tableName = 'MAP' + map.id + '_MAPTBL'; }
// 						if ( f.type === 'description' ) { f.tableName = 'STREAM' + f.streamid + '_DESCTBL' + f.id; }

// 						if ( f.type === 'description' ) {
// 							selects.push( '\n\t' + f.tableName + '.' + f.name + ' AS ' + f.onField + '_DESC' );
// 						} else {
// 							selects.push( '\n\t' + f.tableName + '.' + f.name );
// 						}
// 					} );
// 					if ( map.matrix ) {
// 						selects.push( '\n\tIF(ISNULL(MATRIX' + map.matrix + '_MATRIXTBL.id), \'invalid\', \'valid\') AS Matrix_' + map.matrix + '_Result' );
// 					}
// 					const mapTableName = 'MAP' + map.id + '_MAPTBL';
// 					let selectQuery = '';
// 					selectQuery += 'SELECT ';
// 					selectQuery += selects.join( ', ' ) + ' \n';
// 					selectQuery += 'FROM ' + mapTableName + ' ';
// 					mapFieldList.forEach( f => {
// 						if ( f.type === 'description' ) {
// 							selectQuery += '\n\tLEFT JOIN ' + f.tableName + ' ON ' + f.tableName + '.RefField = ' + mapTableName + '.' + f.onField;
// 						}
// 					} );
// 					if ( map.matrix ) {
// 						const mtname = 'MATRIX' + map.matrix + '_MATRIXTBL';
// 						selectQuery += '\n\tLEFT JOIN ' + mtname + ' ON \n\t\t';
// 						selectQuery += process.targetStreamFields.filter( f => matrix.fields[f.id] ).map( f => mtname + '.' + f.name + ' = ' + mapTableName + '.TAR_' + f.name ).join( ' AND \n\t\t' );
// 					}
// 					let wherers: string[]; wherers = [];
// 					mapFieldList.forEach( ( curField ) => {
// 						if ( curField.srctar === 'target' && curField.type === 'main' ) {
// 							wherers.push( '\n\t' + curField.name + ' IS NULL' );
// 							wherers.push( curField.name + ' = \'missing\'' );
// 						}
// 					} );
// 					if ( map.matrix ) {
// 						wherers.push( '\n\tISNULL(MATRIX' + map.matrix + '_MATRIXTBL.id)' );
// 					}
// 					if ( wherers.length > 0 ) {
// 						selectQuery += ' \n';
// 						selectQuery += 'WHERE ';
// 						selectQuery += wherers.join( ' OR ' );
// 					}
// 					return Promise.resolve( selectQuery );
// 				} ).
// 				then( resolve ).
// 				catch( reject );
// 		} );
// 	}
// 	private sendMissingRunQuery = ( refQuery: string, refMap: DimeMap ) => {
// 		return new Promise( ( resolve, reject ) => {
// 			this.db.query( refQuery, ( err, result, fields ) => {
// 				if ( err ) {
// 					reject( err );
// 				} else {
// 					resolve( { map: refMap, result: result } );
// 				}
// 			} );
// 		} );
// 	}
// 	private sendMissingCreateFile = ( mapsAndResults: any[] ) => {
// 		return new Promise( ( resolve, reject ) => {
// 			let workbook: any; workbook = new excel.Workbook();
// 			workbook.creator = 'EPM ToolBox';
// 			workbook.lastModifiedBy = 'EPM ToolBox';
// 			workbook.created = new Date();
// 			workbook.modified = new Date();

// 			mapsAndResults.forEach( ( curMapAndResult: any ) => {
// 				const curMap = curMapAndResult.map;
// 				const curResult = curMapAndResult.result;
// 				let sheet;
// 				sheet = workbook.addWorksheet( curMap.name, { views: [{ ySplit: 1 }] } );
// 				if ( curResult.length === 0 ) {
// 					sheet.addRow( ['There is no data produced with the missing map mechanism. If in doubt, please contact system admin.'] );
// 				} else {
// 					let keys: any[]; keys = [];
// 					Object.keys( curResult[0] ).forEach( ( dfkey ) => {
// 						keys.push( dfkey );
// 					} );
// 					let curColumns: any[]; curColumns = [];
// 					Object.keys( curResult[0] ).forEach( ( dfkey ) => {
// 						curColumns.push( { header: dfkey, key: dfkey } );
// 					} );
// 					sheet.columns = curColumns;
// 					sheet.addRows( curResult );
// 				}
// 			} );

// 			resolve( workbook );
// 		} );
// 	}
// 	private sendMissingSendFile = ( refProcess: DimeProcessRunning, refStep: DimeProcessStepRunning, refBook: any ) => {
// 		return new Promise( ( resolve, reject ) => {
// 			let systemAdminInfo: DimeSetting;
// 			this.logTool.appendLog( refProcess.currentlog, 'Step ' + refStep.position + ' - Send Missing Maps: Sending data file.' ).
// 				then( () => this.settingsTool.getOne( 'systemadmin' ) ).
// 				then( ( systemadmin: DimeSetting ) => {
// 					systemAdminInfo = systemadmin;
// 					return this.workbookToStreamBuffer( refBook );
// 				} ).
// 				then( ( theStreamBuffer: any ) => {
// 					return this.mailTool.sendMail( {
// 						from: systemAdminInfo.emailaddress,
// 						to: refProcess.recepients,
// 						subject: 'Missing map list for Process: ' + refProcess.name,
// 						text: 'Hi,\n\nYou can kindly find the file as attached.\n\nBest Regards\n' + systemAdminInfo.fromname,
// 						attachments: [
// 							{
// 								filename: refProcess.name + ' Missing Map File (' + this.tools.getFormattedDateTime() + ').xlsx',
// 								content: theStreamBuffer.getContents()
// 							}
// 						]
// 					} );
// 				} ).
// 				then( ( result ) => {
// 					return Promise.resolve( 'ok' );
// 				} ).
// 				then( resolve ).
// 				catch( reject );
// 		} );
// 	}
// 	private runSendLog = ( refProcess: DimeProcessRunning, refStep: DimeProcessStepRunning ) => {
// 		const toLogProcess = <DimeProcessRunning>{};
// 		toLogProcess.id = refProcess.id;
// 		toLogProcess.name = refProcess.name;
// 		toLogProcess.currentlog = refProcess.currentlog;
// 		toLogProcess.erroremail = refProcess.erroremail;
// 		toLogProcess.recepients = refStep.detailsObject.map( recepient => recepient.address ).join( ', ' );
// 		return this.sendLogFile( toLogProcess, false );
// 	}
// 	private sendLogFile = ( refProcess: DimeProcessRunning, iserror: boolean ) => {
// 		return new Promise( ( resolve, reject ) => {
// 			let systemAdminInfo: DimeSetting;
// 			this.settingsTool.getOne( 'systemadmin' ).
// 				then( ( systemadmin: DimeSetting ) => {
// 					systemAdminInfo = systemadmin;
// 					return this.logTool.checkLog( refProcess.currentlog );
// 				} ).
// 				then( ( curLog: any ) => {
// 					const curEmail: any = {};
// 					if ( iserror ) {
// 						curEmail.to = refProcess.erroremail;
// 					} else {
// 						curEmail.to = refProcess.recepients;
// 					}
// 					curEmail.from = systemAdminInfo.emailaddress;
// 					curEmail.subject = '';
// 					if ( iserror ) { curEmail.subject += 'Process Error - '; }
// 					curEmail.subject += 'Log for process: ' + refProcess.name;
// 					curEmail.text = curLog.details;
// 					curEmail.html = '<pre>' + curLog.details + '</pre>';
// 					if ( curEmail.to === '' || !curEmail.to ) { curEmail.to = systemAdminInfo.emailaddress; }
// 					this.mailTool.sendMail( curEmail ).
// 						then( () => {
// 							resolve( refProcess );
// 						} ).
// 						catch( reject );
// 				} ).
// 				catch( reject );
// 		} );
// 	}
// 	private runSendData = ( process: DimeProcessRunning, step: DimeProcessStepRunning ) => {
// 		return new Promise( ( resolve, reject ) => {
// 			process.recepients = step.detailsObject.map( recepient => recepient.address ).join( ', ' );
// 			this.logTool.appendLog( process.currentlog, 'Step ' + step.position + ': Send data.' ).
// 				then( () => this.sendDataDropCrossTable( process, step ) ).
// 				then( () => this.sendDataCreateCrossTable( process, step ) ).
// 				then( ( result ) => this.sendDataInsertDistincts( process, step, result ) ).
// 				then( ( result ) => this.sendDataPopulateDataColumns( process, step, result ) ).
// 				then( ( result ) => this.sendDataPopulateDescriptionColumns( process, step, result ) ).
// 				then( ( result ) => this.sendDataCreateFile( process, step, result ) ).
// 				then( ( result ) => this.sendDataSendFile( process, step, result ) ).
// 				then( resolve ).
// 				catch( reject );
// 		} );
// 	}
// 	private sendDataDropCrossTable = ( process: DimeProcessRunning, step: DimeProcessStepRunning ) => {
// 		return new Promise( ( resolve, reject ) => {
// 			this.logTool.appendLog( process.currentlog, 'Step ' + step.position + ' - Send Data: Dropping crosstab table.' ).then( () => {
// 				this.db.query( 'DROP TABLE IF EXISTS PROCESS' + process.id + '_CRSTBL', ( err, rows, fields ) => {
// 					if ( err ) {
// 						reject( err );
// 					} else {
// 						resolve();
// 					}
// 				} );
// 			} ).catch( reject );
// 		} );
// 	}
// 	private sendDataCreateCrossTable = ( process: DimeProcessRunning, step: DimeProcessStepRunning ): Promise<DimeCartesianDefinitions> => {
// 		return new Promise( ( resolve, reject ) => {
// 			this.logTool.appendLog( process.currentlog, 'Step ' + step.position + ' - Send Data: Creating crosstab table.' ).
// 				then( () => {
// 					let createQuery: string; createQuery = 'CREATE TABLE PROCESS' + process.id + '_CRSTBL (\nid BIGINT UNSIGNED NOT NULL AUTO_INCREMENT';
// 					let dataFieldDefinition: any; dataFieldDefinition = {};
// 					let inserterFields: any[]; inserterFields = [];
// 					process.CRSTBLDescribedFields = [];

// 					process.sourceStreamFields.forEach( ( curField: DimeStreamFieldDetail ) => {
// 						if ( !curField.isCrossTab && !curField.isData && !curField.shouldIgnoreCrossTab ) {
// 							createQuery += '\n';
// 							if ( process.sourceStream.type === DimeStreamType.RDBT && curField.type === 'string' ) {
// 								createQuery += ', SRC_' + curField.name + ' VARCHAR(' + curField.fCharacters + ')';
// 							}
// 							if ( process.sourceStream.type === DimeStreamType.RDBT && curField.type === 'number' ) {
// 								createQuery += ', SRC_' + curField.name + ' NUMERIC(' + curField.fPrecision + ',' + curField.fDecimals + ')';
// 							}
// 							if ( process.sourceStream.type === DimeStreamType.RDBT && curField.type === 'date' ) {
// 								createQuery += ', SRC_' + curField.name + ' DATETIME';
// 							}
// 							if ( process.sourceStream.type === DimeStreamType.HPDB ) {
// 								createQuery += ', SRC_' + curField.name + ' VARCHAR(80)';
// 								createQuery += ', SRC_' + curField.name + '_Desc VARCHAR(1024)';
// 								process.CRSTBLDescribedFields.push( { fieldid: curField.id, fieldname: 'SRC_' + curField.name } );
// 							}
// 							if ( curField.isDescribed ) {
// 								if ( curField.ddfType === 'string' ) {
// 									createQuery += ', SRC_' + curField.name + '_Desc VARCHAR(' + curField.ddfCharacters + ')';
// 								}
// 								if ( curField.ddfType === 'number' ) {
// 									createQuery += ', SRC_' + curField.name + '_Desc NUMERIC(' + curField.ddfPrecision + ',' + curField.ddfDecimals + ')';
// 								}
// 								if ( curField.ddfType === 'date' ) {
// 									createQuery += ', SRC_' + curField.name + '_Desc DATETIME';
// 								}
// 								process.CRSTBLDescribedFields.push( { fieldid: curField.id, fieldname: 'SRC_' + curField.name } );
// 							}
// 							inserterFields.push( 'SRC_' + curField.name );
// 							createQuery += ', INDEX (SRC_' + curField.name + ')';
// 						}
// 					} );

// 					process.targetStreamFields.forEach( ( curField ) => {
// 						if ( !curField.isCrossTab && !curField.shouldIgnoreCrossTab ) {
// 							createQuery += '\n';
// 							if ( process.sourceStream.type === DimeStreamType.RDBT && curField.type === 'string' ) {
// 								createQuery += ', TAR_' + curField.name + ' VARCHAR(' + curField.fCharacters + ')';
// 							}
// 							if ( process.sourceStream.type === DimeStreamType.RDBT && curField.type === 'number' ) {
// 								createQuery += ', TAR_' + curField.name + ' NUMERIC(' + curField.fPrecision + ',' + curField.fDecimals + ')';
// 							}
// 							if ( process.sourceStream.type === DimeStreamType.RDBT && curField.type === 'date' ) {
// 								createQuery += ', TAR_' + curField.name + ' DATETIME';
// 							}
// 							if ( process.targetStream.type === DimeStreamType.HPDB ) {
// 								createQuery += ', TAR_' + curField.name + ' VARCHAR(80)';
// 								createQuery += ', TAR_' + curField.name + '_DESC VARCHAR(1024)';
// 								process.CRSTBLDescribedFields.push( { fieldid: curField.id, fieldname: 'TAR_' + curField.name } );
// 							}
// 							inserterFields.push( 'TAR_' + curField.name );
// 							createQuery += ', INDEX (TAR_' + curField.name + ')';
// 						}
// 					} );

// 					process.sourceStreamFields.forEach( ( curField ) => {
// 						if ( curField.isData ) {
// 							dataFieldDefinition.type = curField.type;
// 							dataFieldDefinition.characters = curField.fCharacters;
// 							dataFieldDefinition.precision = curField.fPrecision;
// 							dataFieldDefinition.decimals = curField.fDecimals;
// 							dataFieldDefinition.name = curField.name;
// 							dataFieldDefinition.aggregateFunction = curField.aggregateFunction;
// 						}
// 					} );

// 					process.steps.filter( s => s.type === DimeProcessStepType.ValidateData ).forEach( s => {
// 						createQuery += '\n, Matrix_' + s.referedid + '_Result VARCHAR(7), INDEX (Matrix_' + s.referedid + '_Result) ';
// 						inserterFields.push( 'Matrix_' + s.referedid + '_Result' );
// 					} );

// 					const toResolve: any = {};
// 					toResolve.cartesianFields = process.sourceStreamFields.filter( f => f.isCrossTab ).map( f => ( { name: f.name, isMonth: f.isMonth, type: f.type, maxlength: 0, varname: f.name, srctar: 'source' } ) );
// 					toResolve.inserterFields = inserterFields;
// 					toResolve.dataFieldDefinition = dataFieldDefinition;

// 					this.getDataTableDistinctFields( process, toResolve.cartesianFields, 'source', true, step, true ).then( ( result: any[] ) => {
// 						toResolve.cartesianArray = this.sortCartesian( toResolve.cartesianFields, result );
// 						toResolve.cartesianArray.forEach( cartesian => {
// 							createQuery += '\n, `' + Object.values( cartesian ).join( '-' ) + '`';
// 							if ( dataFieldDefinition.type === 'string' ) {
// 								createQuery += ' VARCHAR(' + dataFieldDefinition.characters + ')';
// 							}
// 							if ( dataFieldDefinition.type === 'number' ) {
// 								createQuery += ' NUMERIC(' + dataFieldDefinition.precision + ',' + dataFieldDefinition.decimals + ')';
// 							}
// 							if ( dataFieldDefinition.type === 'date' ) {
// 								createQuery += ' DATETIME';
// 							}
// 						} );
// 						createQuery += '\n, PRIMARY KEY(id) );';
// 						this.db.query( createQuery, ( err, rows, fields ) => {
// 							if ( err ) {
// 								reject( err );
// 							} else {
// 								resolve( toResolve );
// 							}
// 						} );
// 					} ).catch( reject );
// 				} ).
// 				catch( reject );
// 		} );
// 	}
// 	private sendDataInsertDistincts = ( process: DimeProcessRunning, step: DimeProcessStepRunning, definitions: DimeCartesianDefinitions ): Promise<DimeCartesianDefinitions> => {
// 		return new Promise( ( resolve, reject ) => {
// 			this.logTool.appendLog( process.currentlog, 'Step ' + step.position + ' - Send Data: Inserting distinct combinations.' ).
// 				then( () => {
// 					let insertQuery: string; insertQuery = 'INSERT INTO PROCESS' + process.id + '_CRSTBL (';
// 					insertQuery += definitions.inserterFields.join( ', ' );
// 					insertQuery += ')\n';
// 					insertQuery += 'SELECT DISTINCT ' + definitions.inserterFields.join( ', ' ) + ' FROM PROCESS' + process.id + '_DATATBL';
// 					this.db.query( insertQuery, ( err, rows, fields ) => {
// 						if ( err ) {
// 							reject( err );
// 						} else {
// 							resolve( definitions );
// 						}
// 					} );
// 				} ).
// 				catch( reject );
// 		} );
// 	}
// 	private sendDataPopulateDataColumns = ( process: DimeProcessRunning, step: DimeProcessStepRunning, definitions: DimeCartesianDefinitions ): Promise<DimeCartesianDefinitions> => {
// 		return new Promise( ( resolve, reject ) => {
// 			this.logTool.appendLog( process.currentlog, 'Step ' + step.position + ' - Send Data: Populating data columns.' ).
// 				then( () => {
// 					definitions.cartesianTemp = definitions.cartesianArray.map( item => JSON.parse( JSON.stringify( item ) ) );
// 					return this.sendDataPopulateDataColumnsAction( process, step, definitions );
// 				} ).
// 				then( resolve ).
// 				catch( reject );
// 		} );
// 	}
// 	private sendDataPopulateDataColumnsAction = ( process: DimeProcessRunning, step: DimeProcessStepRunning, definitions: DimeCartesianDefinitions ): Promise<DimeCartesianDefinitions> => {
// 		const curItem = definitions.cartesianTemp.shift();
// 		return new Promise( ( resolve, reject ) => {
// 			this.logTool.appendLog( process.currentlog, 'Step ' + step.position + ' - Send Data: Populating data column for ' + Object.values( curItem ).join( '-' ) ).catch( console.error );
// 			let updateWherers: string[]; updateWherers = [];
// 			let updateQuery: string; updateQuery = 'UPDATE PROCESS' + process.id + '_CRSTBL CT \n\tLEFT JOIN ';

// 			if ( definitions.dataFieldDefinition.aggregateFunction ) {
// 				let subQuery = '\n\t\tSELECT ';
// 				subQuery += '\n\t\t\t' + definitions.inserterFields.join( ', \n\t\t\t' );
// 				definitions.cartesianFields.filter( f => f.srctar === 'source' ).forEach( field => { subQuery += ', \n\t\t\tSRC_' + field.name; } );
// 				subQuery += ', \n\t\t\t';
// 				subQuery += definitions.dataFieldDefinition.aggregateFunction + '(SRC_' + definitions.dataFieldDefinition.name + ') AS SRC_' + definitions.dataFieldDefinition.name;
// 				subQuery += ' \n\t\tFROM PROCESS' + process.id + '_DATATBL ';
// 				let whereFields: string[]; whereFields = [];
// 				let whereValues: string[]; whereValues = [];
// 				definitions.cartesianFields.filter( f => f.srctar === 'source' ).forEach( ( curField: any, curKey: number ) => {
// 					whereFields.push( 'SRC_' + curField.name + ' = ?' );
// 					whereValues.push( curItem[curField.name] );
// 				} );
// 				whereValues.forEach( ( curWhere ) => {
// 					updateWherers.push( curWhere );
// 				} );
// 				if ( whereFields.length > 0 ) { subQuery += ' WHERE ' + whereFields.join( ' AND ' ); }
// 				subQuery += ' \n\t\tGROUP BY \n\t\t\t';
// 				subQuery += definitions.inserterFields.join( ', \n\t\t\t' );
// 				definitions.cartesianFields.filter( f => f.srctar === 'source' ).forEach( f => { subQuery += ', SRC_' + f.name; } );
// 				subQuery += ' \n\t\tHAVING \n\t\t\t' + definitions.dataFieldDefinition.aggregateFunction + '(SRC_' + definitions.dataFieldDefinition.name + ') <> 0';
// 				updateQuery += '(' + subQuery + '\n\t) DT ON \n\t\t';
// 			} else {
// 				updateQuery += 'PROCESS' + process.id + '_DATATBL DT ON ';
// 			}

// 			let onFields: string[]; onFields = [];
// 			definitions.inserterFields.forEach( ( curField: any ) => {
// 				onFields.push( 'CT.' + curField + ' = DT.' + curField );
// 			} );

// 			definitions.cartesianFields.forEach( ( curField: any, curKey: number ) => {
// 				let curPrefix: string; curPrefix = '';
// 				if ( curField.srctar === 'source' ) { curPrefix = 'SRC_'; }
// 				if ( curField.srctar === 'target' ) { curPrefix = 'TAR_'; }
// 				onFields.push( 'DT.' + curPrefix + curField.name + ' = ?' );
// 			} );

// 			updateQuery += onFields.join( ' AND \n\t\t' );
// 			updateQuery += ' \n\tSET CT.`' + Object.values( curItem ).join( '-' ) + '` = DT.SRC_' + definitions.dataFieldDefinition.name;

// 			Object.values( curItem ).forEach( ( curWhere: any ) => {
// 				updateWherers.push( curWhere );
// 			} );
// 			this.db.query( updateQuery, updateWherers, ( err, rows, fields ) => {
// 				if ( err ) {
// 					reject( err );
// 				} else {
// 					if ( definitions.cartesianTemp.length === 0 ) {
// 						resolve( definitions );
// 					} else {
// 						resolve( this.sendDataPopulateDataColumnsAction( process, step, definitions ) );
// 					}
// 				}
// 			} );
// 		} );
// 	}
// 	private sendDataPopulateDescriptionColumns = ( refProcess: DimeProcessRunning, refStep: DimeProcessStepRunning, refDefinitions: DimeCartesianDefinitions ): Promise<DimeCartesianDefinitions> => {
// 		return new Promise( ( resolve, reject ) => {
// 			this.logTool.appendLog( refProcess.currentlog, 'Step ' + refStep.position + ' - Send Data: Populating description columns.' ).
// 				then( () => {
// 					asynclib.eachOfSeries(
// 						refProcess.CRSTBLDescribedFields,
// 						( item, key, callback ) => {
// 							let selectQuery = '';
// 							selectQuery += 'SELECT TABLE_NAME FROM information_schema.tables ';
// 							selectQuery += 'WHERE TABLE_SCHEMA = \'' + this.tools.config.mysql.db + '\' AND TABLE_NAME LIKE \'STREAM%_DESCTBL' + item.fieldid + '\'';
// 							this.db.query( selectQuery, ( err, rows, fields ) => {
// 								if ( err ) {
// 									this.logTool.appendLog( refProcess.currentlog, 'Step ' + refStep.position + ' - Send Data: Populating description columns error, can not find table for ' + item.fieldname ).
// 										then( function () { callback(); } );
// 								} else {
// 									let selectedTable: string; selectedTable = '';
// 									rows.forEach( ( curTable: any ) => {
// 										selectedTable = curTable.TABLE_NAME;
// 									} );

// 									if ( selectedTable === '' ) {
// 										const toLog = 'Step ' + refStep.position + ' - Send Data: Populating description columns - no table for ' + item.fieldname;
// 										this.logTool.appendLog( refProcess.currentlog, toLog ).then( () => { callback(); } );
// 									} else {
// 										const toLog = 'Step ' + refStep.position + ' - Send Data: Populating description column for ' + item.fieldname;
// 										this.logTool.appendLog( refProcess.currentlog, toLog ).
// 											then( () => {
// 												let updateQuery: string; updateQuery = '';
// 												updateQuery += 'UPDATE PROCESS' + refProcess.id + '_CRSTBL CT LEFT JOIN ' + selectedTable + ' ST';
// 												updateQuery += ' ON CT.' + item.fieldname + ' = ST.RefField';
// 												updateQuery += ' SET ';
// 												updateQuery += ' CT.' + item.fieldname + '_Desc = ST.Description';
// 												this.db.query( updateQuery, ( uErr, uRows, uFields ) => {
// 													if ( uErr ) {
// 														const toLogC = 'Step ' + refStep.position + ' - Send Data: Population description columns - ' + item.fieldname + ' population has failed';
// 														this.logTool.appendLog( refProcess.currentlog, toLogC ).
// 															then( () => { callback(); } );
// 													} else {
// 														callback();
// 													}
// 												} );
// 											} );
// 									}
// 								}
// 							} );
// 						}, () => {
// 							resolve( refDefinitions );
// 						}
// 					);
// 				} ).
// 				catch( reject );
// 		} );
// 	}
// 	private sendDataCreateFile = ( process: DimeProcessRunning, step: DimeProcessStepRunning, definitions: any ) => {
// 		return new Promise( ( resolve, reject ) => {
// 			this.logTool.appendLog( process.currentlog, 'Step ' + step.position + ' - Send Data: Creating data file.' ).
// 				then( () => {
// 					let selectQuery: string; selectQuery = 'SELECT * FROM PROCESS' + process.id + '_CRSTBL';
// 					let wherers: string[]; wherers = [];
// 					definitions.cartesianArray.forEach( ( curItem: any ) => {
// 						wherers.push( '`' + Object.values( curItem ).join( '-' ) + '` <> 0' );
// 					} );
// 					if ( wherers.length > 0 ) {
// 						selectQuery += ' WHERE (' + wherers.join( ' OR ' ) + ')';
// 					}
// 					this.db.query( selectQuery, ( err, rows, fields ) => {
// 						if ( err ) {
// 							reject( err );
// 						} else {
// 							const workbook = new excel.Workbook();
// 							workbook.creator = 'EPM ToolBox';
// 							workbook.lastModifiedBy = 'EPM ToolBox';
// 							workbook.created = new Date();
// 							workbook.modified = new Date();

// 							let sheet;

// 							if ( rows.length === 0 ) {
// 								sheet = workbook.addWorksheet( 'Warning', { views: [{ ySplit: 1 }] } );
// 								sheet.addRow( ['There is no data produced with the data file mechanism. If in doubt, please contact system admin.'] );
// 							} else {
// 								let keys: any[]; keys = [];
// 								Object.keys( rows[0] ).forEach( ( dfkey ) => {
// 									keys.push( dfkey );
// 								} );
// 								let curColumns: any[]; curColumns = [];
// 								Object.keys( rows[0] ).forEach( ( dfkey ) => {
// 									curColumns.push( { header: dfkey, key: dfkey } );
// 								} );
// 								sheet = workbook.addWorksheet( 'Data', { views: [{ state: 'frozen', xSplit: 1, ySplit: 1, activeCell: 'A1' }] } );
// 								sheet.columns = curColumns;
// 								sheet.addRows( rows );
// 							}
// 							resolve( { workbook, definitions } );
// 						}
// 					} );
// 				} ).
// 				catch( reject );
// 		} );
// 	}
// 	private workbookToStreamBuffer = ( workbook: any ) => {
// 		return new Promise( ( resolve, reject ) => {
// 			let myWritableStreamBuffer: any; myWritableStreamBuffer = new streamBuffers.WritableStreamBuffer();
// 			workbook.xlsx.write( myWritableStreamBuffer ).
// 				then( () => {
// 					resolve( myWritableStreamBuffer );
// 				} ).
// 				catch( reject );
// 		} );
// 	}
// 	private sendDataSendFile = ( refProcess: DimeProcessRunning, refStep: DimeProcessStepRunning, refDefs: any ) => {
// 		return new Promise( ( resolve, reject ) => {
// 			let systemAdminInfo: DimeSetting;
// 			this.logTool.appendLog( refProcess.currentlog, 'Step ' + refStep.position + ' - Send Data: Sending data file.' ).
// 				then( () => this.settingsTool.getOne( 'systemadmin' ) ).
// 				then( ( systemadmin: DimeSetting ) => {
// 					systemAdminInfo = systemadmin;
// 					return this.workbookToStreamBuffer( refDefs.workbook );
// 				} ).
// 				then( ( theStream: any ) => {
// 					return this.mailTool.sendMail( {
// 						from: systemAdminInfo.emailaddress,
// 						to: refProcess.recepients,
// 						cc: systemAdminInfo.emailaddress,
// 						subject: 'Data File for Process: ' + refProcess.name,
// 						text: 'Hi,\n\nYou can kindly find the data file as attached.\n\nBest Regards\n' + systemAdminInfo.fromname,
// 						attachments: [
// 							{
// 								filename: refProcess.name + ' Data File (' + this.tools.getFormattedDateTime() + ').xlsx',
// 								content: theStream.getContents()
// 							}
// 						]
// 					} );
// 				} ).
// 				then( ( result ) => {
// 					return Promise.resolve( 'ok' );
// 				} ).
// 				then( resolve ).
// 				catch( reject );
// 		} );
// 	}
// 	private runTargetProcedure = ( refProcess: DimeProcessRunning, refStep: DimeProcessStepRunning ) => {
// 		return new Promise( ( resolve, reject ) => {
// 			this.logTool.appendLog( refProcess.currentlog, 'Step ' + refStep.position + ': Run target procedure.' ).
// 				then( () => this.runTargetProcedurePrepareCombinations( refProcess, refStep ) ).
// 				then( ( result: any[] ) => this.runTargetProcedureRunProcedures( refProcess, refStep, result ) ).
// 				then( resolve ).
// 				catch( reject );
// 		} );
// 	}
// 	private runTargetProcedurePrepareCombinations = ( refProcess: DimeProcessRunning, refStep: DimeProcessStepRunning ) => {
// 		return new Promise( ( resolve, reject ) => {
// 			this.logTool.appendLog( refProcess.currentlog, 'Step ' + refStep.position + ' - Run Target Procedure: Preparing combinations.' ).
// 				then( () => {
// 					const promises: any[] = [];
// 					promises.push(
// 						this.getDataTableDistinctFields(
// 							refProcess,
// 							refStep.detailsObject.variables.filter( variable => variable.valuetype === 'filteredvalues' ).map( variable => ( { name: variable.dimension, varname: variable.name } ) ),
// 							'target',
// 							true,
// 							refStep,
// 							false
// 						)
// 					);
// 					promises.push(
// 						this.getDataTableDistinctFields(
// 							refProcess,
// 							refStep.detailsObject.variables.filter( variable => variable.valuetype === 'allvalues' ).map( variable => ( { name: variable.dimension, varname: variable.name } ) ),
// 							'target',
// 							false,
// 							refStep,
// 							false
// 						)
// 					);
// 					refStep.detailsObject.variables
// 						.filter( variable => variable.valuetype === 'manualvalue' )
// 						.map( variable => { const toReturn: any = {}; toReturn[variable.name] = variable.value; return toReturn; } )
// 						.forEach( variable => {
// 							promises.push( [variable] );
// 						} );
// 					Promise.all( promises ).then( result => {
// 						let cartesianArray: any[] = [{}];
// 						result.forEach( subjects => {
// 							const currentCartesian: any[] = [];
// 							subjects.forEach( subject => {
// 								cartesianArray.forEach( currentPass => {
// 									currentCartesian.push( Object.assign( JSON.parse( JSON.stringify( currentPass ) ), JSON.parse( JSON.stringify( subject ) ) ) );
// 								} );
// 							} );
// 							if ( currentCartesian.length > 0 ) {
// 								cartesianArray = currentCartesian;
// 							}
// 						} );

// 						const fieldList: any[] = [];

// 						const variableObject = _.keyBy( refStep.detailsObject.variables, 'name' );
// 						if ( cartesianArray.length > 0 ) {
// 							refProcess.targetStreamFields.forEach( field => {
// 								Object.keys( cartesianArray[0] ).forEach( variable => {
// 									if ( variableObject[variable].dimension === field.name ) {
// 										fieldList.push( { name: field.name, isMonth: field.isMonth, type: field.type, maxlength: 0, varname: variable } );
// 									}
// 								} );
// 							} );
// 						}

// 						cartesianArray = this.sortCartesian( fieldList, cartesianArray );
// 						resolve( cartesianArray );
// 					} ).catch( reject );
// 				} ).catch( reject );
// 		} );
// 	}
// 	private sortCartesian = ( fieldList: { name: string, isMonth: boolean, type: string, maxlength: number, varname: string }[], cartesianArray: any[] ) => {
// 		fieldList.forEach( field => {
// 			cartesianArray.forEach( subject => {
// 				if ( subject[field.varname] ) {
// 					if ( subject[field.varname].length > field.maxlength ) {
// 						field.maxlength = subject[field.varname].length;
// 					}
// 				}
// 			} );
// 		} );
// 		cartesianArray.forEach( subject => {
// 			subject[verylongelementname] = '';
// 			fieldList.forEach( field => {
// 				if ( field.isMonth || field.type === 'Time' ) {
// 					subject[verylongelementname] += getMonthSorterValue( subject[field.varname].toString() );
// 				} else {
// 					subject[verylongelementname] += subject[field.varname].toString().padEnd( field.maxlength );
// 				}
// 			} );
// 		} );
// 		cartesianArray.sort( SortByVeryLongElementName );
// 		cartesianArray.forEach( subject => {
// 			delete subject[verylongelementname];
// 		} );
// 		return cartesianArray;
// 	}
// 	// tslint:disable-next-line:max-line-length
// 	private getDataTableDistinctFields = ( refProcess: DimeProcessRunning, fieldList: { name: string, varname: string }[], srctar: 'source' | 'target', shouldFilter: boolean, refStep: DimeProcessStepRunning, isForDataFile: boolean ) => {
// 		return new Promise( ( resolve, reject ) => {
// 			this.logTool.appendLog( refProcess.currentlog, 'Step ' + refStep.position + ' - Getting distinct values for field(s) - ' + fieldList.map( field => field.name ).join( ' - ' ) + '.' ).then( () => {
// 				if ( fieldList && fieldList.length > 0 ) {

// 					const selector: string = srctar === 'source' ? 'SRC_' : 'TAR_';
// 					let localWherers: string[] = [];

// 					if ( shouldFilter ) {
// 						if ( isForDataFile ) {
// 							localWherers = localWherers.concat( refProcess.wherersDataFileWithSrc );
// 						} else {
// 							localWherers = localWherers.concat( refProcess.wherersWithSrc );
// 						}
// 					}
// 					localWherers = localWherers.concat( fieldList.map( field => selector + field.name + '<> \'missing\'' ) );
// 					localWherers = localWherers.concat( fieldList.map( field => selector + field.name + '<> \'missing:missing\'' ) );
// 					localWherers = localWherers.concat( fieldList.map( field => selector + field.name + '<> \'missing::missing\'' ) );
// 					localWherers = localWherers.concat( fieldList.map( field => selector + field.name + '<> \'ignore\'' ) );
// 					localWherers = localWherers.concat( fieldList.map( field => selector + field.name + '<> \'ignore:ignore\'' ) );
// 					localWherers = localWherers.concat( fieldList.map( field => selector + field.name + '<> \'ignore::ignore\'' ) );

// 					const wherePart = ' WHERE ' + localWherers.join( ' AND ' );

// 					const selectQuery = 'SELECT DISTINCT ' + fieldList.map( field => selector + field.name + ' AS ' + field.varname ).join( ', ' ) + ' FROM PROCESS' + refProcess.id + '_DATATBL' + wherePart;
// 					this.db.query( selectQuery, ( err, rows, fields ) => {
// 						if ( err ) {
// 							reject( err );
// 						} else {
// 							resolve( rows );
// 						}
// 					} );
// 				} else {
// 					resolve( [] );
// 				}
// 			} ).catch( reject );
// 		} );
// 	}
// 	private runTargetProcedureRunProcedures = ( refProcess: DimeProcessRunning, refStep: DimeProcessStepRunning, cartesianArray: any[] ) => {
// 		return new Promise( ( resolve, reject ) => {
// 			this.logTool.appendLog( refProcess.currentlog, 'Step ' + refStep.position + ' - Run Target Procedure: Running procedures.' ).
// 				then( () => {
// 					asynclib.eachOfSeries( cartesianArray, ( item, key, callback ) => {
// 						const currentProcedure: any = {};
// 						currentProcedure.stream = refProcess.targetStream;
// 						currentProcedure.procedure = {
// 							name: refStep.detailsObject.name,
// 							hasRTP: refStep.detailsObject.hasRTP,
// 							type: refStep.detailsObject.type,
// 							variables: Object.keys( item ).map( itemkey => ( { name: itemkey, value: item[itemkey] } ) )
// 						};
// 						currentProcedure.dbName = refProcess.targetStream.dbName;
// 						currentProcedure.tableName = refProcess.targetStream.tableName;
// 						if ( refStep.detailsObject.selectedTable ) currentProcedure.procedure.tableName = refStep.detailsObject.selectedTable;
// 						this.runTargetProcedureRunProcedureAction( currentProcedure, refProcess.currentlog ).then( result => {
// 							callback();
// 						} ).catch( callback );
// 					}, ( err ) => {
// 						if ( err ) {
// 							reject( err );
// 						} else {
// 							resolve( refProcess );
// 						}
// 					} );
// 				} ).catch( reject );
// 		} );
// 	}
// 	private runTargetProcedureRunProcedureAction = ( currentProcedure: any, tracker: number ) => {
// 		return new Promise( ( resolve, reject ) => {
// 			let toLog: string; toLog = 'Step Run Target Procedure: Running procedure ' + currentProcedure.procedure.name + ' with values ';
// 			currentProcedure.procedure.variables.forEach( ( curVariable: any, curKey: number ) => {
// 				toLog += curVariable.name + '=' + curVariable.value;
// 				if ( curKey < ( currentProcedure.procedure.variables.length - 1 ) ) { toLog += ', '; }
// 			} );
// 			this.logTool.appendLog( tracker, toLog ).
// 				then( () => this.environmentTool.runProcedure( currentProcedure ) ).
// 				then( resolve ).
// 				catch( reject );
// 		} );
// 	}
// 	private runPushData = ( refProcess: DimeProcessRunning, refStep: DimeProcessStepRunning ) => {
// 		return new Promise( ( resolve, reject ) => {
// 			let cellsTotalCount = 0;
// 			let cellsValidCount = 0;
// 			let cellsInvalidCount = 0;
// 			this.logTool.appendLog( refProcess.currentlog, 'Step ' + refStep.position + ': Push data is initiating.' ).
// 				then( () => this.populateTargetStreamDescriptions( refProcess ) ).
// 				then( () => this.clearSummaryTable( refProcess, refStep ) ).
// 				then( () => this.summarizeData( refProcess, refStep ) ).
// 				then( () => this.fetchSummarizedData( refProcess, refStep ) ).
// 				then( ( result: any[] ) => this.pushDataAction( refProcess, refStep, result ) ).
// 				then( ( result: any ) => {
// 					cellsTotalCount = result.cellsTotalCount;
// 					cellsValidCount = result.cellsValidCount;
// 					cellsInvalidCount = result.cellsInvalidCount;
// 					if ( !result.issueList ) {
// 						result.issueList = [];
// 					}
// 					if ( result.issueList.length > 0 ) {
// 						return this.logTool.appendLog( refProcess.currentlog, 'Step ' + refStep.position + ': There are issues with data push\n' + result.issueList.join( '\n' ) );
// 					} else {
// 						return this.logTool.appendLog( refProcess.currentlog, 'Step ' + refStep.position + ': Data push is completed successfully' );
// 					}
// 				} ).
// 				then( ( result: any ) => this.logTool.appendLog( refProcess.currentlog, 'Step ' + refStep.position + ': Total number of cell write attempts: ' + cellsTotalCount ) ).
// 				then( ( result: any ) => this.logTool.appendLog( refProcess.currentlog, 'Step ' + refStep.position + ': Number of valid cells: ' + cellsValidCount ) ).
// 				then( ( result: any ) => this.logTool.appendLog( refProcess.currentlog, 'Step ' + refStep.position + ': Number of invalid cells: ' + cellsInvalidCount ) ).
// 				then( resolve ).
// 				catch( reject );
// 		} );
// 	}
// 	private populateTargetStreamDescriptions = ( refProcess: DimeProcessRunning ) => {
// 		return new Promise( ( resolve, reject ) => {
// 			this.logTool.appendLog( refProcess.currentlog, 'Step ' + refProcess.curStep + ' - Push Data: Populating field descriptions.' ).
// 				then( () => {
// 					return this.streamTool.populateFieldDescriptions( refProcess.targetStream.id );
// 				} ).
// 				then( () => {
// 					resolve( refProcess );
// 				} ).
// 				catch( reject );
// 		} );
// 	}
// 	private clearSummaryTable = ( refProcess: DimeProcessRunning, refStep: DimeProcessStepRunning ) => {
// 		return new Promise( ( resolve, reject ) => {
// 			this.logTool.appendLog( refProcess.currentlog, 'Step ' + refStep.position + ' - Push Data: Clearing Summary Table.' ).
// 				then( () => {
// 					this.db.query( 'DELETE FROM PROCESS' + refProcess.id + '_SUMTBL', ( err, rows, fields ) => {
// 						if ( err ) {
// 							reject( err );
// 						} else {
// 							resolve( 'OK' );
// 						}
// 					} );
// 				} ).
// 				catch( reject );
// 		} );
// 	}
// 	private summarizeData = ( refProcess: DimeProcessRunning, refStep: DimeProcessStepRunning ) => {
// 		return new Promise( ( resolve, reject ) => {
// 			this.logTool.appendLog( refProcess.currentlog, 'Step ' + refStep.position + ' - Push Data: Populating summary table.' ).
// 				then( () => {
// 					let insertQuery: string; insertQuery = 'INSERT INTO PROCESS' + refProcess.id + '_SUMTBL \n\t(';
// 					let insList: string[]; insList = [];
// 					let selList: string[]; selList = [];
// 					let grpList: string[]; grpList = [];
// 					refProcess.targetStreamFields.forEach( ( curField ) => {
// 						insList.push( curField.name );
// 						selList.push( 'TAR_' + curField.name );
// 						grpList.push( 'TAR_' + curField.name );
// 					} );
// 					let shouldGroup = false;
// 					refProcess.sourceStreamFields.forEach( ( curField ) => {
// 						if ( curField.isData ) {
// 							if ( curField.aggregateFunction ) {
// 								shouldGroup = true;
// 								selList.push( curField.aggregateFunction + '(SRC_' + curField.name + ')' );
// 							} else {
// 								selList.push( 'SRC_' + curField.name );
// 							}
// 						}
// 					} );
// 					insList.push( 'SUMMARIZEDRESULT' );
// 					insertQuery += insList.join( ', ' );
// 					insertQuery += ') \n';
// 					insertQuery += 'SELECT \n\t';
// 					insertQuery += selList.join( ', \n\t' );
// 					insertQuery += ' \nFROM \n\tPROCESS' + refProcess.id + '_DATATBL';

// 					const insertWherers: string[] = [];

// 					refProcess.steps.filter( step => step.type === DimeProcessStepType.ValidateData ).forEach( step => { insertWherers.push( 'Matrix_' + step.referedid + '_Result = \'valid\'' ); } );
// 					refProcess.wherersWithSrc.forEach( wherer => { insertWherers.push( wherer ); } );

// 					if ( insertWherers.length > 0 ) {
// 						insertQuery += ' \nWHERE \n\t' + insertWherers.join( ' \n\tAND ' );
// 					}

// 					if ( shouldGroup ) { insertQuery += ' \nGROUP BY \n\t' + grpList.join( ', \n\t' ); }
// 					this.db.query( insertQuery, ( err, rows, fields ) => {
// 						if ( err ) {
// 							reject( err );
// 						} else {
// 							resolve( refProcess );
// 						}
// 					} );
// 				} ).
// 				catch( reject );
// 		} );
// 	}
// 	private fetchSummarizedData = ( refProcess: DimeProcessRunning, refStep: DimeProcessStepRunning ) => {
// 		return new Promise( ( resolve, reject ) => {
// 			this.logTool.appendLog( refProcess.currentlog, 'Step ' + refStep.position + ' - Push Data: Fetching summary table.' ).
// 				then( () => {
// 					const denseField = refProcess.targetStreamFields[refProcess.targetStreamFields.length - 1].name;
// 					this.db.query( 'SELECT DISTINCT ' + denseField + ' FROM PROCESS' + refProcess.id + '_SUMTBL ORDER BY 1', ( err, rows, fields ) => {
// 						if ( err ) {
// 							reject( err );
// 						} else {
// 							let sQuery = 'SELECT ';
// 							let selecters: string[]; selecters = [];
// 							for ( let i = 0; i < ( refProcess.targetStreamFields.length - 1 ); i++ ) {
// 								selecters.push( refProcess.targetStreamFields[i].name );
// 							}
// 							let concaters: string[]; concaters = [];
// 							rows.forEach( ( curTuple: any ) => {
// 								if (
// 									curTuple[denseField] !== 'ignore' && curTuple[denseField] !== 'ignore:ignore' && curTuple[denseField] !== 'ignore::ignore' &&
// 									curTuple[denseField] !== 'missing' && curTuple[denseField] !== 'missing:missing' && curTuple[denseField] !== 'missing::missing'
// 								) {
// 									concaters.push( 'GROUP_CONCAT((CASE ' + denseField + ' WHEN \'' + curTuple[denseField] + '\' THEN SUMMARIZEDRESULT ELSE NULL END)) AS \'' + curTuple[denseField] + '\'' );
// 								}
// 							} );
// 							sQuery += selecters.join( ', ' );
// 							if ( concaters.length > 0 ) {
// 								sQuery += ', ';
// 								sQuery += concaters.join( ', ' );
// 							}
// 							sQuery += ' FROM PROCESS' + refProcess.id + '_SUMTBL';
// 							sQuery += ' WHERE ';
// 							let wherers: string[]; wherers = [];
// 							selecters.forEach( function ( curField ) {
// 								wherers.push( curField + ' <> \'missing\'' );
// 								wherers.push( curField + ' <> \'missing:missing\'' );
// 								wherers.push( curField + ' <> \'missing::missing\'' );
// 								wherers.push( curField + ' <> \'ignore\'' );
// 								wherers.push( curField + ' <> \'ignore:ignore\'' );
// 								wherers.push( curField + ' <> \'ignore::ignore\'' );
// 								wherers.push( curField + ' IS NOT NULL' );
// 							} );
// 							wherers.push( 'SUMMARIZEDRESULT <> 0' );
// 							wherers.push( 'SUMMARIZEDRESULT IS NOT NULL' );
// 							sQuery += wherers.join( ' AND ' );
// 							sQuery += ' GROUP BY ' + selecters.join( ', ' );
// 							this.db.query( sQuery, ( serr, srows, sfields ) => {
// 								if ( serr ) {
// 									reject( serr );
// 								} else {
// 									resolve( srows );
// 								}
// 							} );
// 						}
// 					} );
// 				} ).
// 				catch( reject );
// 		} );
// 	}
// 	private pushDataAction = ( refProcess: DimeProcessRunning, refStep: DimeProcessStepRunning, finalData: any[] ) => {
// 		return new Promise( ( resolve, reject ) => {
// 			this.logTool.appendLog( refProcess.currentlog, 'Step ' + refStep.position + ' - Push Data: Pushing data to the target.' ).then( () => {
// 				if ( !finalData ) {
// 					this.logTool.appendLog( refProcess.currentlog, 'Step ' + refStep.position + ' - Push Data: There is no data to push.' ).then( () => { resolve( { issueList: ['There is no data to push'] } ); } );
// 				} else if ( finalData.length === 0 ) {
// 					this.logTool.appendLog( refProcess.currentlog, 'Step ' + refStep.position + ' - Push Data: There is no data to push.' ).then( () => { resolve( { issueList: ['There is no data to push'] } ); } );
// 				} else {
// 					const sparseDims: string[] = [];
// 					for ( let i = 0; i < ( refProcess.targetStreamFields.length - 1 ); i++ ) {
// 						sparseDims.push( refProcess.targetStreamFields[i].name );
// 					}
// 					this.environmentTool.writeData( {
// 						id: refProcess.targetStream.environment,
// 						data: finalData,
// 						db: refProcess.targetStream.dbName,
// 						table: refProcess.targetStream.tableName,
// 						sparseDims: sparseDims,
// 						denseDim: refProcess.targetStreamFields[refProcess.targetStreamFields.length - 1].name
// 					} ).then( resolve ).catch( reject );
// 				}
// 			} ).catch( reject );
// 		} );
// 	}
// 	private runTransformations = ( refProcess: DimeProcessRunning, refStep: DimeProcessStepRunning ) => {
// 		return new Promise( ( resolve, reject ) => {
// 			this.logTool.appendLog( refProcess.currentlog, 'Step ' + refStep.position + ': Transform data is initiating.' ).then( () => {
// 				let transformations: DimeProcessTransformation[];
// 				transformations = JSON.parse( refStep.details ? refStep.details : '[]' ).sort( SortByPosition );
// 				return this.runTransformationsAction( refProcess, transformations, refStep );
// 			} ).then( resolve ).catch( reject );
// 		} );
// 	}
// 	private runTransformationsAction = ( refProcess: DimeProcessRunning, transformations: DimeProcessTransformation[], refStep: DimeProcessStepRunning ) => {
// 		return new Promise( ( resolve, reject ) => {
// 			let logText: string;
// 			if ( transformations.length === 0 ) {
// 				logText = 'Step ' + refStep.position + ' - Transform data: Completed';
// 			} else {
// 				logText = 'Step ' + refStep.position + ' - Transform data: Transformation ' + ( transformations[0].position + 1 ) + ' is running.';
// 			}
// 			this.logTool.appendLog( refProcess.currentlog, logText ).
// 				then( () => {
// 					if ( transformations.length === 0 ) {
// 						resolve();
// 					} else {
// 						const transformation = transformations.shift();
// 						if ( !transformation ) {
// 							reject( new Error( 'Transformation is not defined' ) );
// 						} else if ( !transformation.when ) {
// 							reject( new Error( 'Transformation does not have a when statement' ) );
// 						} else if ( !transformation.field ) {
// 							reject( new Error( 'Transformation does not have an assigned field' ) );
// 						} else if ( !transformation.comparer ) {
// 							reject( new Error( 'Transformation does not have a comparison operator' ) );
// 						} else if ( !transformation.comparison ) {
// 							reject( new Error( 'Transformation does not have a comparison value' ) );
// 						} else if ( !transformation.whichField ) {
// 							reject( new Error( 'Transformation does not identify the column to be transformed' ) );
// 						} else if ( !transformation.operation ) {
// 							reject( new Error( 'Transformation does not have an assigned operation' ) );
// 						} else if ( !transformation.operator ) {
// 							reject( new Error( 'Transformation does not have an assigned value' ) );
// 						} else {
// 							let updateQuery: string; updateQuery = 'UPDATE PROCESS' + refProcess.id + '_DATATBL';
// 							updateQuery += ' SET ';
// 							if ( transformation.whichField === 'current' ) {
// 								if ( transformation.when === 'SRC' ) {
// 									refProcess.sourceStreamFields.forEach( ( curField ) => {
// 										if ( curField.name === transformation.field ) {
// 											transformation.fieldToManipulate = curField;
// 											transformation.fieldToManipulate.qName = 'SRC_' + curField.name;
// 										}
// 									} );
// 								} else {
// 									refProcess.targetStreamFields.forEach( ( curField ) => {
// 										if ( curField.name === transformation.field ) {
// 											transformation.fieldToManipulate = curField;
// 											transformation.fieldToManipulate.qName = 'TAR_' + curField.name;
// 										}
// 									} );
// 								}
// 							} else {
// 								refProcess.sourceStreamFields.forEach( ( curField ) => {
// 									if ( curField.isData ) {
// 										transformation.fieldToManipulate = curField;
// 										transformation.fieldToManipulate.qName = 'SRC_' + curField.name;
// 									}
// 								} );
// 							}
// 							updateQuery += transformation.fieldToManipulate.qName + ' = ';

// 							let shouldReject = false;
// 							let rejectReason = '';
// 							let valueArray: any[]; valueArray = [];

// 							if ( transformation.operation === 'multiply' ) {
// 								if ( transformation.fieldToManipulate.type !== 'number' ) {
// 									shouldReject = true;
// 									rejectReason = 'Non-number type fields can not be multiplied.';
// 								} else if ( !isNumeric( transformation.operator ) ) {
// 									shouldReject = true;
// 									rejectReason = 'Operator field is not numeric';
// 								} else {
// 									updateQuery += transformation.fieldToManipulate.qName + ' * (?)';
// 									valueArray.push( parseFloat( transformation.operator ) );
// 								}
// 							}
// 							if ( transformation.operation === 'divide' ) {
// 								if ( transformation.fieldToManipulate.type !== 'number' ) {
// 									shouldReject = true;
// 									rejectReason = 'Non-number type fields can not be divided.';
// 								} else if ( !isNumeric( transformation.operator ) ) {
// 									shouldReject = true;
// 									rejectReason = 'Operator field is not numeric';
// 								} else {
// 									updateQuery += transformation.fieldToManipulate.qName + ' / (?)';
// 									valueArray.push( parseFloat( transformation.operator ) );
// 								}
// 							}
// 							if ( transformation.operation === 'add' ) {
// 								if ( transformation.fieldToManipulate.type !== 'number' ) {
// 									shouldReject = true;
// 									rejectReason = 'Non-number type fields can not be added.';
// 								} else if ( !isNumeric( transformation.operator ) ) {
// 									shouldReject = true;
// 									rejectReason = 'Operator field is not numeric';
// 								} else {
// 									updateQuery += transformation.fieldToManipulate.qName + ' + (?)';
// 									valueArray.push( parseFloat( transformation.operator ) );
// 								}
// 							}
// 							if ( transformation.operation === 'subtract' ) {
// 								if ( transformation.fieldToManipulate.type !== 'number' ) {
// 									shouldReject = true;
// 									rejectReason = 'Non-number type fields can not be subtracted.';
// 								} else if ( !isNumeric( transformation.operator ) ) {
// 									shouldReject = true;
// 									rejectReason = 'Operator field is not numeric';
// 								} else {
// 									updateQuery += transformation.fieldToManipulate.qName + ' - (?)';
// 									valueArray.push( parseFloat( transformation.operator ) );
// 								}
// 							}
// 							if ( transformation.operation === 'set' ) {
// 								updateQuery += '?';
// 								valueArray.push( transformation.operator );
// 							}
// 							updateQuery += ' WHERE ';
// 							updateQuery += transformation.when + '_' + transformation.field;
// 							if ( transformation.comparer === 'like' ) { updateQuery += ' LIKE ? '; }
// 							if ( transformation.comparer === 'equals' ) { updateQuery += ' = ? '; }
// 							valueArray.push( transformation.comparison );

// 							let wherers: any[]; wherers = [];
// 							refProcess.filters.forEach( ( curFilter ) => {
// 								if ( curFilter.filterfrom ) { wherers.push( 'SRC_' + curFilter.fieldName + '>= \'' + curFilter.filterfrom + '\'' ); }
// 								if ( curFilter.filterto ) { wherers.push( 'SRC_' + curFilter.fieldName + '<=\'' + curFilter.filterto + '\'' ); }
// 								if ( curFilter.filtertext ) { wherers.push( 'SRC_' + curFilter.fieldName + ' LIKE \'' + curFilter.filtertext + '\'' ); }
// 								if ( curFilter.filterbeq ) { wherers.push( 'SRC_' + curFilter.fieldName + '>=' + curFilter.filterbeq ); }
// 								if ( curFilter.filterseq ) { wherers.push( 'SRC_' + curFilter.fieldName + '<=' + curFilter.filterseq ); }
// 							} );
// 							if ( wherers.length > 0 ) {
// 								updateQuery += 'AND ' + wherers.join( ' AND ' );
// 							}
// 							if ( shouldReject ) {
// 								reject( rejectReason );
// 							} else {
// 								this.db.query( updateQuery, valueArray, ( err, rows, fields ) => {
// 									if ( err ) {
// 										reject( err );
// 									} else {
// 										resolve( this.runTransformationsAction( refProcess, transformations, refStep ) );
// 									}
// 								} );
// 							}
// 						}
// 					}
// 				} ).
// 				catch( reject );
// 		} );
// 	}
// 	private runMapData = ( refProcess: DimeProcessRunning, refStep: DimeProcessStepRunning ) => {
// 		return new Promise( ( resolve, reject ) => {
// 			this.logTool.appendLog( refProcess.currentlog, 'Step ' + refStep.position + ': Map Data is initiating.' ).
// 				then( () => this.mapDataAction( refProcess, refStep ) ).
// 				then( () => this.mapDataAssignMissing( refProcess, refStep ) ).
// 				then( () => this.mapDataClearMap( refProcess, refStep ) ).
// 				then( () => this.mapDataRefreshMap( refProcess, refStep ) ).
// 				then( resolve ).
// 				catch( reject );
// 		} );
// 	}
// 	private mapDataAssignMissing = ( refProcess: DimeProcessRunning, refStep: DimeProcessStepRunning ) => {
// 		return new Promise( ( resolve, reject ) => {
// 			this.logTool.appendLog( refProcess.currentlog, 'Step ' + refStep.position + ' - Map Data: Identifying missing maps.' ).
// 				then( () => {
// 					return this.mapTool.getFields( refStep.referedid );
// 				} ).
// 				then( ( mapFields: any[] ) => {
// 					let curQuery: string; curQuery = '';
// 					curQuery += 'UPDATE PROCESS' + refProcess.id + '_DATATBL SET ';
// 					let setters: string[]; setters = [];
// 					let wherers: string[]; wherers = [];
// 					mapFields.forEach( ( curField ) => {
// 						if ( curField.srctar === 'target' ) {
// 							setters.push( 'TAR_' + curField.name + '=\'missing\'' );
// 							wherers.push( 'TAR_' + curField.name + ' IS NULL' );
// 						}
// 					} );
// 					curQuery += setters.join( ', ' );
// 					curQuery += ' WHERE ' + wherers.join( ' OR ' );
// 					this.db.query( curQuery, ( err, result, fields ) => {
// 						if ( err ) {
// 							reject( err );
// 						} else {
// 							resolve();
// 						}
// 					} );
// 				} ).
// 				catch( reject );
// 		} );
// 	}
// 	private mapDataClearMap = ( refProcess: DimeProcessRunning, refStep: DimeProcessStepRunning ) => {
// 		return new Promise( ( resolve, reject ) => {
// 			this.logTool.appendLog( refProcess.currentlog, 'Step ' + refStep.position + ' - Map Data: Clearing map table from the missing map tuples.' ).
// 				then( () => {
// 					return this.mapTool.getFields( refStep.referedid );
// 				} ).
// 				then( ( mapFields: any[] ) => {
// 					let wherers: string[]; wherers = [];
// 					mapFields.forEach( ( curField ) => {
// 						if ( curField.srctar === 'target' ) {
// 							wherers.push( 'TAR_' + curField.name + ' IS NULL' );
// 							wherers.push( 'TAR_' + curField.name + ' = \'missing\'' );
// 						}
// 					} );
// 					this.db.query( 'DELETE FROM MAP' + refStep.referedid + '_MAPTBL WHERE ' + wherers.join( ' OR ' ), function ( err, rows, fields ) {
// 						if ( err ) {
// 							reject( err );
// 						} else {
// 							resolve();
// 						}
// 					} );
// 				} ).
// 				catch( reject );
// 		} );
// 	}
// 	private mapDataRefreshMap = ( refProcess: DimeProcessRunning, refStep: DimeProcessStepRunning ) => {
// 		return new Promise( ( resolve, reject ) => {
// 			this.logTool.appendLog( refProcess.currentlog, 'Step ' + refStep.position + ' - Map Data: Populating the map table with missing maps to be mapped.' ).
// 				then( () => {
// 					return this.mapTool.getFields( refStep.referedid );
// 				} ).
// 				then( ( mapFields: any[] ) => {
// 					let wherers: string[]; wherers = [];
// 					let selecters: string[]; selecters = [];
// 					let insertQuery: string; insertQuery = '';
// 					mapFields.forEach( ( curField ) => {
// 						if ( curField.srctar === 'source' ) { selecters.push( 'SRC_' + curField.name ); }
// 						if ( curField.srctar === 'target' ) { selecters.push( 'TAR_' + curField.name ); }
// 						if ( curField.srctar === 'target' ) {
// 							wherers.push( 'TAR_' + curField.name + ' IS NULL' );
// 							wherers.push( 'TAR_' + curField.name + ' = \'missing\'' );
// 						}
// 					} );
// 					insertQuery += 'INSERT INTO MAP' + refStep.referedid + '_MAPTBL ';
// 					insertQuery += '(' + selecters.join( ', ' ) + ') ';
// 					insertQuery += 'SELECT DISTINCT ' + selecters.join( ', ' ) + ' FROM PROCESS' + refProcess.id + '_DATATBL ';
// 					insertQuery += 'WHERE ' + wherers.join( ' OR ' );
// 					this.db.query( insertQuery, ( err, rows, fields ) => {
// 						if ( err ) {
// 							reject( err );
// 						} else {
// 							resolve();
// 						}
// 					} );
// 				} ).
// 				catch( reject );
// 		} );
// 	}
// 	private mapDataAction = ( refProcess: DimeProcessRunning, refStep: DimeProcessStepRunning ) => {
// 		return new Promise( ( resolve, reject ) => {
// 			let updateQuery: string; updateQuery = '';
// 			updateQuery += 'UPDATE PROCESS' + refProcess.id + '_DATATBL DT LEFT JOIN MAP' + refStep.referedid + '_MAPTBL MT ON ';
// 			let setFields: string[]; setFields = [];
// 			let onFields: string[]; onFields = [];
// 			this.logTool.appendLog( refProcess.currentlog, 'Step ' + refStep.position + ' - Map Data: Mapping the data table.' ).
// 				then( () => {
// 					return this.mapTool.rejectIfNotReady( refStep.referedid );
// 				} ).
// 				then( this.mapTool.getFields ).
// 				then( ( mapFields: any[] ) => {
// 					mapFields.forEach( ( curField ) => {
// 						if ( curField.srctar === 'source' ) { onFields.push( 'DT.SRC_' + curField.name + ' = MT.SRC_' + curField.name ); }
// 						if ( curField.srctar === 'target' ) { setFields.push( 'DT.TAR_' + curField.name + ' = MT.TAR_' + curField.name ); }
// 					} );
// 					updateQuery += onFields.join( ' AND ' );
// 					updateQuery += ' SET ' + setFields.join( ', ' );
// 					this.db.query( updateQuery, ( err, result, fields ) => {
// 						if ( err ) {
// 							reject( err );
// 						} else {
// 							resolve( refProcess );
// 						}
// 					} );
// 				} ).
// 				catch( reject );
// 		} );
// 	}
// 	private runPullData = ( refProcess: DimeProcessRunning, refStep: DimeProcessStepRunning ) => {
// 		return new Promise( ( resolve, reject ) => {
// 			this.logTool.appendLog( refProcess.currentlog, 'Step ' + refStep.position + ': Pull Data is initiating.' ).
// 				then( () => this.clearStaging( refProcess ) ).
// 				then( this.pullFromSource ).
// 				then( this.insertToStaging ).
// 				then( this.assignDefaults ).
// 				then( this.populateSourceStreamDescriptions ).
// 				then( resolve ).
// 				catch( reject );
// 		} );
// 	}
// 	private populateSourceStreamDescriptions = ( refProcess: DimeProcessRunning ) => {
// 		return new Promise( ( resolve, reject ) => {
// 			this.logTool.appendLog( refProcess.currentlog, 'Step ' + refProcess.curStep + ' - Pull Data: Populating field descriptions.' ).
// 				then( () => {
// 					return this.streamTool.populateFieldDescriptions( refProcess.sourceStream.id );
// 				} ).
// 				then( () => {
// 					resolve( refProcess );
// 				} ).
// 				catch( reject );
// 		} );
// 	}
// 	private assignDefaults = ( refProcess: DimeProcessRunning ) => {
// 		return new Promise( ( resolve, reject ) => {
// 			this.logTool.appendLog( refProcess.currentlog, 'Step ' + refProcess.curStep + ' - Pull Data: Assigning default targets to the staging table.' ).
// 				then( () => {
// 					return this.fetchDefaults( refProcess.id );
// 				} ).
// 				then( ( defaults: DimeProcessDefaultTarget[] ) => {
// 					asynclib.eachOfSeries(
// 						defaults,
// 						( item, key, callback ) => {
// 							this.assignDefault( item, refProcess.wherersWithSrc ).then( () => { callback(); } ).catch( callback );
// 						},
// 						( err ) => {
// 							if ( err ) {
// 								reject( err );
// 							} else {
// 								resolve( refProcess );
// 							}
// 						}
// 					);
// 				} ).
// 				catch( reject );
// 		} );
// 	}
// 	private assignDefault = ( curDefault: DimeProcessDefaultTarget, wherersWithSrc: string[] ) => {
// 		return new Promise( ( resolve, reject ) => {
// 			let query = 'UPDATE PROCESS' + curDefault.process + '_DATATBL SET ?? = ?';
// 			if ( wherersWithSrc && wherersWithSrc.length > 0 ) {
// 				query += ' WHERE ' + wherersWithSrc.join( ' AND ' );
// 			}
// 			this.db.query( query, ['TAR_' + curDefault.field, curDefault.value], ( err, result, fields ) => {
// 				if ( err ) {
// 					reject( err );
// 				} else {
// 					resolve( 'OK' );
// 				}
// 			} );
// 		} );
// 	}
// 	private insertToStaging = ( refProcess: DimeProcessRunning ) => {
// 		return new Promise( ( resolve, reject ) => {
// 			this.logTool.appendLog( refProcess.currentlog, 'Step ' + refProcess.curStep + ' - Pull Data: Inserting data to the staging table.' ).
// 				then( () => {
// 					if ( refProcess.pullResult.length === 0 ) {
// 						resolve( refProcess );
// 					} else {
// 						const curKeys = Object.keys( refProcess.pullResult[0] );
// 						let insertQuery: string; insertQuery = '';
// 						insertQuery += 'INSERT INTO PROCESS' + refProcess.id + '_DATATBL (' + curKeys.join( ', ' ) + ') VALUES ?';
// 						let curArray: any[];
// 						refProcess.pullResult.forEach( ( curResult, curItem ) => {
// 							curArray = [];
// 							curKeys.forEach( ( curKey ) => {
// 								curArray.push( curResult[curKey] );
// 							} );
// 							refProcess.pullResult[curItem] = curArray;
// 						} );
// 						this.db.query( insertQuery, [refProcess.pullResult], ( err, rows, fields ) => {
// 							if ( err ) {
// 								reject( err );
// 							} else {
// 								resolve( refProcess );
// 							}
// 						} );
// 					}
// 				} ).
// 				catch( reject );
// 		} );
// 	}
// 	private pullFromSource = ( refProcess: DimeProcessRunning ) => {
// 		return new Promise( ( resolve, reject ) => {
// 			this.logTool.appendLog( refProcess.currentlog, 'Step ' + refProcess.curStep + ' - Pull Data: Pulling data from source stream with the given filters.' ).
// 				then( () => {
// 					let selectQuery: string; selectQuery = 'SELECT ';
// 					let selectFields: string[]; selectFields = [];
// 					let groupFields: string[]; groupFields = [];
// 					refProcess.sourceStreamFields.forEach( ( curField ) => {
// 						if ( curField.isData ) {
// 							if ( curField.aggregateFunction ) {
// 								selectFields.push( curField.aggregateFunction + '(' + curField.name + ') AS SRC_' + curField.name );
// 							} else {
// 								selectFields.push( curField.name + ' AS SRC_' + curField.name );
// 							}
// 						} else {
// 							groupFields.push( curField.name );
// 							selectFields.push( curField.name + ' AS SRC_' + curField.name );
// 						}
// 					} );
// 					selectQuery += selectFields.join( ', ' );
// 					selectQuery += ' FROM ';
// 					if ( refProcess.sourceStream.tableName === 'Custom Query' ) {
// 						if ( refProcess.sourceStream.customQuery ) {
// 							let subQuery: string; subQuery = refProcess.sourceStream.customQuery;
// 							subQuery = subQuery.trim();
// 							if ( subQuery.substr( subQuery.length - 1 ) === ';' ) {
// 								subQuery = subQuery.substr( 0, subQuery.length - 1 );
// 							}
// 							refProcess.sourceStream.customQuery = subQuery;
// 						}
// 						selectQuery += '(' + refProcess.sourceStream.customQuery + ') AS CSQ';
// 					} else {
// 						selectQuery += refProcess.sourceStream.tableName;
// 					}
// 					if ( refProcess.wherers.length > 0 ) {
// 						selectQuery += ' WHERE ' + refProcess.wherers.join( ' AND ' );
// 					}
// 					if ( groupFields.length > 0 ) {
// 						selectQuery += ' GROUP BY ' + groupFields.join( ', ' );
// 					}
// 					return this.environmentTool.runProcedure( { stream: refProcess.sourceStream, procedure: selectQuery } );
// 				} ).
// 				then( ( result: any[] ) => {
// 					refProcess.pullResult = result;
// 					resolve( refProcess );
// 				} ).
// 				catch( reject );
// 		} );
// 	}
// 	private clearStaging = ( refProcess: DimeProcessRunning ) => {
// 		return new Promise( ( resolve, reject ) => {
// 			this.logTool.appendLog( refProcess.currentlog, 'Step ' + refProcess.curStep + ' - Pull Data: Clearing staging table.' ).
// 				then( () => {
// 					let clearQuery: string;
// 					clearQuery = 'DELETE FROM PROCESS' + refProcess.id + '_DATATBL';
// 					if ( refProcess.wherers.length > 0 ) {
// 						clearQuery += ' WHERE ' + refProcess.wherersWithSrc.join( ' AND ' );
// 					}
// 					this.db.query( clearQuery, ( err, result, fields ) => {
// 						if ( err ) {
// 							reject( err );
// 						} else {
// 							resolve( refProcess );
// 						}
// 					} );
// 				} ).catch( reject );
// 		} );
// 	}
// 	private fetchFiltersToRefProcess = ( refProcess: DimeProcessRunning ) => {
// 		return new Promise( ( resolve, reject ) => {
// 			this.logTool.appendLog( refProcess.currentlog, 'Fetching filters.' ).
// 				then( () => {
// 					return this.fetchFilters( refProcess.id );
// 				} ).
// 				then( ( filters: any[] ) => {
// 					refProcess.filters = filters;
// 					refProcess.wherers = [];
// 					refProcess.filters.forEach( ( curFilter ) => {
// 						refProcess.sourceStreamFields.forEach( ( curField ) => {
// 							if ( curField.id === curFilter.field ) { curFilter.fieldName = curField.name; }
// 						} );
// 						if ( curFilter.filterfrom ) { refProcess.wherers.push( curFilter.fieldName + '>=\'' + curFilter.filterfrom + '\'' ); }
// 						if ( curFilter.filterto ) { refProcess.wherers.push( curFilter.fieldName + '<=\'' + curFilter.filterto + '\'' ); }
// 						if ( curFilter.filtertext ) { refProcess.wherers.push( curFilter.fieldName + ' LIKE \'' + curFilter.filtertext + '\'' ); }
// 						if ( curFilter.filterbeq ) { refProcess.wherers.push( curFilter.fieldName + '>=' + curFilter.filterbeq ); }
// 						if ( curFilter.filterseq ) { refProcess.wherers.push( curFilter.fieldName + '<=' + curFilter.filterseq ); }
// 					} );
// 					refProcess.wherersWithSrc = refProcess.wherers.map( wherer => 'SRC_' + wherer );
// 					return this.fetchFiltersDataFile( refProcess.id );
// 				} ).
// 				then( ( filters: any[] ) => {
// 					refProcess.filtersDataFile = filters;
// 					refProcess.wherersDataFile = [];
// 					refProcess.filtersDataFile.forEach( ( curFilter ) => {
// 						refProcess.sourceStreamFields.forEach( ( curField ) => {
// 							if ( curField.id === curFilter.field ) { curFilter.fieldName = curField.name; }
// 						} );
// 						if ( curFilter.filterfrom ) { refProcess.wherersDataFile.push( curFilter.fieldName + '>=\'' + curFilter.filterfrom + '\'' ); }
// 						if ( curFilter.filterto ) { refProcess.wherersDataFile.push( curFilter.fieldName + '<=\'' + curFilter.filterto + '\'' ); }
// 						if ( curFilter.filtertext ) { refProcess.wherersDataFile.push( curFilter.fieldName + ' LIKE \'' + curFilter.filtertext + '\'' ); }
// 						if ( curFilter.filterbeq ) { refProcess.wherersDataFile.push( curFilter.fieldName + '>=' + curFilter.filterbeq ); }
// 						if ( curFilter.filterseq ) { refProcess.wherersDataFile.push( curFilter.fieldName + '<=' + curFilter.filterseq ); }
// 					} );
// 					refProcess.wherersDataFileWithSrc = refProcess.wherersDataFile.map( wherer => 'SRC_' + wherer );
// 					resolve( refProcess );
// 				} ).
// 				catch( reject );
// 		} );
// 	}
// 	private runSourceProcedure = ( refProcess: DimeProcessRunning, refStep: DimeProcessStepRunning ) => {
// 		return new Promise( ( resolve, reject ) => {
// 			this.logTool.appendLog( refProcess.currentlog, 'Step ' + refStep.position + ': Source procedure is initiating.' ).
// 				then( () => {
// 					return this.environmentTool.runProcedure( { stream: refProcess.sourceStream, procedure: refStep.details } );
// 				} ).
// 				then( resolve ).
// 				catch( reject );
// 		} );
// 	}
// 	private identifyEnvironments = ( refProcess: DimeProcessRunning ) => {
// 		return new Promise( ( resolve, reject ) => {
// 			this.logTool.appendLog( refProcess.currentlog, 'Identifying process environments.' ).
// 				then( () => {
// 					this.identifySourceEnvironment( refProcess ).
// 						then( this.identifyTargetEnvironment ).
// 						then( resolve ).
// 						catch( reject );
// 				} ).
// 				catch( reject );
// 		} );
// 	}
// 	private identifySourceEnvironment = ( refProcess: DimeProcessRunning ) => {
// 		return new Promise( ( resolve, reject ) => {
// 			this.environmentTool.getEnvironmentDetails( <DimeEnvironmentDetail>{ id: refProcess.source }, true ).
// 				then( ( result: DimeEnvironmentDetail ) => {
// 					refProcess.sourceEnvironment = result;
// 					this.logTool.appendLog( refProcess.currentlog, 'Source environment is identified: ' + result.name );
// 					resolve( refProcess );
// 				} ).catch( reject );
// 		} );
// 	}
// 	private identifyTargetEnvironment = ( refProcess: DimeProcessRunning ) => {
// 		return new Promise( ( resolve, reject ) => {
// 			this.environmentTool.getEnvironmentDetails( <DimeEnvironmentDetail>{ id: refProcess.target }, true ).
// 				then( ( result: DimeEnvironmentDetail ) => {
// 					refProcess.targetEnvironment = result;
// 					this.logTool.appendLog( refProcess.currentlog, 'Target environment is identified: ' + result.name );
// 					resolve( refProcess );
// 				} ).catch( reject );
// 		} );
// 	}
// 	private createTables = ( refProcess: DimeProcessRunning ) => {
// 		return new Promise( ( resolve, reject ) => {
// 			this.logTool.appendLog( refProcess.currentlog, 'Creating process tables if necessary.' );
// 			let promises: any[]; promises = [];
// 			refProcess.isReady.forEach( ( curTable, curKey ) => {
// 				if ( curTable.type === 'datatable' && curTable.status === false ) {
// 					promises.push( this.createDataTable( refProcess, curKey ) );
// 				}
// 				if ( curTable.type === 'sumtable' && curTable.status === false ) {
// 					promises.push( this.createSumTable( refProcess, curKey ) );
// 				}
// 			} );
// 			Promise.all( promises ).
// 				then( ( result ) => {
// 					resolve( refProcess );
// 				} ).
// 				catch( reject );
// 		} );
// 	}
// 	private createSumTable = ( refProcess: DimeProcessRunning, refKey: number ) => {
// 		return new Promise( ( resolve, reject ) => {
// 			this.logTool.appendLog( refProcess.currentlog, 'Process sum table was missing. Creating now.' );
// 			let createQuery: string; createQuery = '';
// 			createQuery += 'CREATE TABLE PROCESS' + refProcess.id + '_SUMTBL (id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT';
// 			refProcess.targetStreamFields.forEach( ( curField ) => {
// 				if ( refProcess.targetStream.type === DimeStreamType.HPDB ) {
// 					createQuery += ', ' + curField.name + ' VARCHAR(80)';
// 				} else if ( curField.type === 'string' ) {
// 					createQuery += ', ' + curField.name + ' VARCHAR(' + curField.fCharacters + ')';
// 				} else if ( curField.type === 'number' ) {
// 					createQuery += ', ' + curField.name + ' NUMERIC(' + curField.fPrecision + ',' + curField.fDecimals + ')';
// 				} else if ( curField.type === 'date' ) {
// 					createQuery += ', ' + curField.name + ' DATETIME';
// 				}
// 			} );
// 			createQuery += ', SUMMARIZEDRESULT NUMERIC(60,15)';
// 			createQuery += ', PRIMARY KEY(id) );';
// 			this.db.query( createQuery, ( err, result, fields ) => {
// 				if ( err ) {
// 					reject( err );
// 				} else {
// 					resolve( 'OK' );
// 				}
// 			} );
// 		} );
// 	}
// 	private createDataTable = ( refProcess: DimeProcessRunning, refKey: number ) => {
// 		return new Promise( ( resolve, reject ) => {
// 			this.logTool.appendLog( refProcess.currentlog, 'Process data table was missing. Creating now.' );
// 			let createQuery: string; createQuery = '';
// 			createQuery += 'CREATE TABLE PROCESS' + refProcess.id + '_DATATBL (id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT';
// 			refProcess.sourceStreamFields.forEach( ( curField ) => {
// 				if ( refProcess.sourceStream.type === DimeStreamType.HPDB ) {
// 					createQuery += ', SRC_' + curField.name + ' VARCHAR(80)';
// 				} else if ( curField.type === 'string' ) {
// 					createQuery += ', SRC_' + curField.name + ' VARCHAR(' + curField.fCharacters + ')';
// 				} else if ( curField.type === 'number' ) {
// 					createQuery += ', SRC_' + curField.name + ' NUMERIC(' + curField.fPrecision + ',' + curField.fDecimals + ')';
// 				} else if ( curField.type === 'date' ) {
// 					createQuery += ', SRC_' + curField.name + ' DATETIME';
// 				}
// 				if ( !curField.isData ) {
// 					createQuery += ', INDEX (SRC_' + curField.name + ')';
// 				}
// 			} );
// 			refProcess.targetStreamFields.forEach( ( curField ) => {
// 				if ( refProcess.targetStream.type === DimeStreamType.HPDB ) {
// 					createQuery += ', TAR_' + curField.name + ' VARCHAR(80)';
// 				} else if ( curField.type === 'string' ) {
// 					createQuery += ', TAR_' + curField.name + ' VARCHAR(' + curField.fCharacters + ')';
// 				} else if ( curField.type === 'number' ) {
// 					createQuery += ', TAR_' + curField.name + ' NUMERIC(' + curField.fPrecision + ',' + curField.fDecimals + ')';
// 				} else if ( curField.type === 'date' ) {
// 					createQuery += ', TAR_' + curField.name + ' DATETIME';
// 				}
// 				if ( !curField.isData ) {
// 					createQuery += ', INDEX (TAR_' + curField.name + ')';
// 				}
// 			} );
// 			createQuery += ', PRIMARY KEY (id) );';
// 			this.db.query( createQuery, ( err, result, fields ) => {
// 				if ( err ) {
// 					reject( err );
// 				} else {
// 					resolve( 'OK' );
// 				}
// 			} );
// 		} );
// 	}
// 	private isReady = ( refProcess: DimeProcessRunning ) => {
// 		return new Promise( ( resolve, reject ) => {
// 			this.isReadyProcess( refProcess ).
// 				then( this.isReadyStreams ).
// 				then( resolve ).
// 				catch( reject );
// 		} );
// 	}
// 	private isReadyStreams = ( refProcess: DimeProcessRunning ) => {
// 		return new Promise( ( resolve, reject ) => {
// 			this.logTool.appendLog( refProcess.currentlog, 'Checking if streams are ready for process run.' );
// 			this.streamTool.isReady( refProcess.sourceStream.id ).
// 				then( ( result ) => {
// 					if ( result === false ) {
// 						this.logTool.appendLog( refProcess.currentlog, 'Source stream (' + refProcess.sourceStream.name + ') is not ready for process run. Preparing.' );
// 						return this.streamTool.prepareTables( refProcess.sourceStream.id );
// 					} else {
// 						this.logTool.appendLog( refProcess.currentlog, 'Source stream (' + refProcess.sourceStream.name + ') is ready for process run. Skipping.' );
// 						return Promise.resolve( 'ok' );
// 					}
// 				} ).
// 				then( ( result ) => {
// 					return this.streamTool.isReady( refProcess.targetStream.id );
// 				} ).
// 				then( ( result ) => {
// 					if ( result === false ) {
// 						this.logTool.appendLog( refProcess.currentlog, 'Target stream (' + refProcess.targetStream.name + ') is not ready for process run. Preparing.' );
// 						return this.streamTool.prepareTables( refProcess.targetStream.id );
// 					} else {
// 						this.logTool.appendLog( refProcess.currentlog, 'Target stream (' + refProcess.targetStream.name + ') is ready for process run. Skipping.' );
// 						return Promise.resolve( 'ok' );
// 					}
// 				} ).
// 				then( () => {
// 					resolve( refProcess );
// 				} ).
// 				catch( reject );
// 		} );
// 	}
// 	private isReadyProcess = ( refProcess: DimeProcessRunning ) => {
// 		return new Promise( ( resolve, reject ) => {
// 			this.logTool.appendLog( refProcess.currentlog, 'Checking if process is ready to be run.' );
// 			const systemDBname = this.tools.config.mysql.db;
// 			this.db.query( 'SELECT * FROM information_schema.tables WHERE table_schema = ? AND table_name LIKE ?', [systemDBname, 'PROCESS' + refProcess.id + '_%'], ( err, rows, fields ) => {
// 				if ( err ) {
// 					reject( err );
// 				} else {
// 					refProcess.isReady = [];
// 					refProcess.isReady.push( { tableName: 'PROCESS' + refProcess.id + '_DATATBL', process: refProcess.id, type: 'datatable', status: false } );
// 					refProcess.isReady.push( { tableName: 'PROCESS' + refProcess.id + '_SUMTBL', process: refProcess.id, type: 'sumtable', status: false } );
// 					rows.forEach( ( curTable: any ) => {
// 						if ( curTable.TABLE_NAME === 'PROCESS' + refProcess.id + '_DATATBL' ) {
// 							this.runningProcessSetTableStatus( refProcess, curTable.TABLE_NAME, true );
// 						}
// 						if ( curTable.TABLE_NAME === 'PROCESS' + refProcess.id + '_SUMTBL' ) {
// 							this.runningProcessSetTableStatus( refProcess, curTable.TABLE_NAME, true );
// 						}
// 					} );
// 					resolve( refProcess );
// 				}
// 			} );
// 		} );
// 	}
// 	private runningProcessSetTableStatus = ( refProcess: DimeProcessRunning, table: string, status: boolean ) => {
// 		refProcess.isReady.forEach( ( curTable ) => {
// 			if ( curTable.tableName === table ) { curTable.status = status; }
// 		} );
// 	}
// 	private identifyStreams = ( refProcess: DimeProcessRunning ) => {
// 		return new Promise( ( resolve, reject ) => {
// 			this.logTool.appendLog( refProcess.currentlog, 'Identifying process streams.' );
// 			this.identifySourceStream( refProcess ).
// 				then( this.identifyTargetStream ).
// 				then( resolve ).
// 				catch( reject );
// 		} );
// 	}
// 	private identifySourceStream = ( refProcess: DimeProcessRunning ) => {
// 		return new Promise( ( resolve, reject ) => {
// 			let ourStep = <DimeProcessStep>{ id: 0, process: refProcess.id, referedid: 0 };
// 			let stepFound: boolean; stepFound = false;
// 			refProcess.steps.forEach( ( curStep ) => {
// 				if ( curStep.type === DimeProcessStepType.PullData ) {
// 					ourStep = curStep;
// 					stepFound = true;
// 				}
// 			} );
// 			if ( stepFound === false ) {
// 				reject( new Error( 'No source stream definition found' ) );
// 			} else {
// 				this.streamTool.getOne( ourStep.referedid || 0 ).
// 					then( ( curStream: DimeStream ) => {
// 						refProcess.sourceStream = curStream;
// 						this.logTool.appendLog( refProcess.currentlog, 'Source stream identified: ' + curStream.name );
// 						return this.streamTool.retrieveFields( ourStep.referedid || 0 );
// 					} ).
// 					then( ( fields: DimeStreamFieldDetail[] ) => {
// 						if ( fields.length === 0 ) {
// 							return Promise.reject( new Error( 'No stream fields are defined for source stream' ) );
// 						} else {
// 							refProcess.sourceStreamFields = fields;
// 							return Promise.resolve( refProcess );
// 						}
// 					} ).
// 					then( resolve ).
// 					catch( reject );
// 			}
// 		} );
// 	}
// 	private identifyTargetStream = ( refProcess: DimeProcessRunning ) => {
// 		return new Promise( ( resolve, reject ) => {
// 			let ourStep = <DimeProcessStep>{ id: 0, process: refProcess.id, referedid: 0 };
// 			let stepFound: boolean; stepFound = false;
// 			refProcess.steps.forEach( ( curStep ) => {
// 				if ( curStep.type === DimeProcessStepType.PushData ) {
// 					ourStep = curStep;
// 					stepFound = true;
// 				}
// 			} );
// 			if ( stepFound === false ) {
// 				reject( new Error( 'No target stream definition found' ) );
// 			} else {
// 				this.streamTool.getOne( ourStep.referedid || 0 ).
// 					then( ( curStream: DimeStream ) => {
// 						refProcess.targetStream = curStream;
// 						this.logTool.appendLog( refProcess.currentlog, 'Target stream identified: ' + curStream.name );
// 						return this.streamTool.retrieveFields( ourStep.referedid || 0 );
// 					} ).
// 					then( ( fields: DimeStreamFieldDetail[] ) => {
// 						if ( fields.length === 0 ) {
// 							return Promise.reject( new Error( 'No stream fields are defined for target stream' ) );
// 						} else {
// 							refProcess.targetStreamFields = fields;
// 							return Promise.resolve( refProcess );
// 						}
// 					} ).
// 					then( resolve ).
// 					catch( reject );
// 			}
// 		} );
// 	}
// 	private identifySteps = ( refProcess: DimeProcessRunning ) => {
// 		return new Promise( ( resolve, reject ) => {
// 			this.logTool.appendLog( refProcess.currentlog, 'Identifying process steps.' );
// 			this.stepLoadAll( refProcess.id ).
// 				then( ( steps: DimeProcessStep[] ) => {
// 					refProcess.steps = steps.map( step => <DimeProcessStepRunning>{ isPending: true, ...step } );
// 					if ( refProcess.steps.length === 0 ) {
// 						reject( new Error( 'No steps defined for this process.' ) );
// 					} else {
// 						resolve( refProcess );
// 					}
// 				} ).
// 				catch( reject );
// 		} );
// 	}
// 	private setInitiated = ( payload: DimeProcess ): Promise<DimeProcessRunning> => {
// 		return new Promise( ( resolve, reject ) => {
// 			if ( payload.status === DimeProcessStatus.Running ) {
// 				reject( new Error( 'Process is already running' ) );
// 			} else {
// 				this.logTool.openLog( 'Starting Process Run', 0, 'process', payload.id ).
// 					then( ( tracker ) => {
// 						payload.status = DimeProcessStatus.Running;
// 						payload.currentlog = tracker;
// 						return payload;
// 					} ).
// 					then( this.update ).
// 					then( resolve ).
// 					catch( reject );
// 			}
// 		} );
// 	}
// 	private setCompleted = ( refProcess: DimeProcessRunning ) => {
// 		return new Promise( ( resolve, reject ) => {
// 			this.logTool.closeLog( refProcess.currentlog ).
// 				then( () => {
// 					return this.setStatus( refProcess.id, DimeProcessStatus.Ready );
// 				} ).
// 				then( resolve ).
// 				catch( reject );
// 		} );
// 	}
// 	public sendDataFile = ( refObj: { id: number, requser: any } ) => {
// 		const id = refObj.id;
// 		const requser = refObj.requser;
// 		return new Promise( ( resolve, reject ) => {
// 			resolve( { result: 'OK' } );
// 			let logID: number;
// 			let topProcess: DimeProcessRunning;
// 			let topStep: DimeProcessStepRunning;
// 			this.logTool.openLog( 'Sending Data File', 0, 'sendDataFile', id ).
// 				then( ( newlogid: number ) => {
// 					logID = newlogid;
// 					return this.getOne( id );
// 				} ).
// 				then( ( innerProcess: DimeProcessRunning ) => {
// 					topProcess = innerProcess;
// 					topProcess.status = logID;
// 					topProcess.recepients = requser.email;
// 					topStep = <DimeProcessStepRunning>{ id: 0, process: id, referedid: id };
// 					return this.sendDataCreateFile( topProcess, topStep, { cartesianArray: [] } );
// 				} ).
// 				then( ( result ) => {
// 					topStep.position = 2;
// 					return this.sendDataSendFile( topProcess, topStep, result );
// 				} ).
// 				then( () => {
// 					return this.logTool.appendLog( logID, 'Data file is successfully sent.' );
// 				} ).
// 				then( () => {
// 					return this.logTool.closeLog( logID );
// 				} ).
// 				catch( ( issue: any ) => {
// 					this.logTool.appendLog( logID, 'Failed:' + JSON.stringify( issue ) ).
// 						then( () => {
// 							return this.logTool.closeLog( logID );
// 						} ).catch( ( logissue: any ) => {
// 							console.log( 'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX' );
// 							console.log( 'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX' );
// 							console.log( 'Fatal issue:' );
// 							console.log( JSON.stringify( logissue ) );
// 							console.log( 'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX' );
// 							console.log( 'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX' );
// 						} );
// 				} );

// 		} );
// 	}
// }
