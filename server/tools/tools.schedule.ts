import { DB } from './tools.db';
import { MainTools } from './tools.main';
import { ATSchedule } from 'shared/models/at.schedule';
import { ATTuple } from 'shared/models/at.tuple';

export class ScheduleTool {
	constructor( private db: DB, private tools: MainTools ) { }

	public getAll = async (): Promise<ATSchedule[]> => {
		const { tuples } = await this.db.query<ATTuple>( 'SELECT * FROM schedules' );
		return tuples.map( t => this.tools.prepareTupleToRead<ATSchedule>( t ) );
	}

	public getOne = async ( id: number ): Promise<ATSchedule> => {
		const { tuple } = await this.db.queryOne<ATTuple>( 'SELECT * FROM schedules WHERE id = ?', id );
		return this.tools.prepareTupleToRead<ATSchedule>( tuple );
	}

	public create = async (): Promise<ATSchedule> => {
		const newSchedule = <ATSchedule>{ name: 'New Schedule' };
		const { tuple } = await this.db.queryOne<any>( 'INSERT INTO schedules SET ?', this.tools.prepareTupleToWrite( newSchedule ) );
		newSchedule.id = tuple.insertId;
		return newSchedule;
	}

	public update = async ( payload: ATSchedule ) => {
		await this.db.queryOne( 'UPDATE schedules SET ? WHERE id = ?', [this.tools.prepareTupleToWrite( payload ), payload.id] );
	}

	public delete = async ( id: number ) => {
		await this.db.query( 'DELETE FROM schedules WHERE id = ?', id );
	}
}
// import { ProcessTools } from './tools.dime.process';
// import { DimeScheduleStep } from '../../shared/model/dime/schedulestep';
// import { SortByPosition } from '../../shared/utilities/utilityFunctions';
// import { DimeScheduleStepType } from '../../shared/enums/dime/schedulesteptypes';
// import * as async from 'async';
// import { MainTools } from './tools.main';
// import { Pool } from 'mysql';

// import { ATStatusType } from '../../shared/enums/generic/statustypes';

// import { DimeSchedule } from '../../shared/model/dime/schedule';
// import { ATLogger } from './tools.log';

// export class DimeScheduleTool {
// 	logTool: ATLogger;
// 	private processTool: ProcessTools;

// 	constructor( public db: Pool, public tools: MainTools ) {
// 		this.logTool = new ATLogger( this.db, this.tools );
// 		this.processTool = new ProcessTools( this.db, this.tools );
// 	}

// 	public getAll = (): Promise<DimeSchedule[]> => {
// 		return new Promise( ( resolve, reject ) => {
// 			this.db.query( 'SELECT * FROM schedules ORDER BY name', ( err, rows, fields ) => {
// 				if ( err ) {
// 					reject( { error: err, message: 'Retrieving items has failed' } );
// 				} else {
// 					rows.forEach( ( curRow: any ) => {
// 						curRow = this.prepareIndividualItem( curRow );
// 					} );
// 					resolve( rows );
// 				}
// 			} );
// 		} );
// 	}
// 	public create = ( sentItem?: DimeSchedule ) => {
// 		if ( sentItem ) { if ( sentItem.id ) { delete sentItem.id; } }
// 		const newItem = this.tools.isEmptyObject( sentItem ) ? <any>{ name: 'New Item (Please change name)' } : <any>sentItem;

// 		if ( !newItem.schedule ) {
// 			// newItem.schedule = [{ second: '0', minute: '0', hour: '0', dayofmonth: '0', month: '0', dayofweek: '0' }];
// 			newItem.schedule = [];
// 		}
// 		newItem.schedule = JSON.stringify( newItem.schedule );

// 		if ( !newItem.steps ) {
// 			newItem.steps = [];
// 		}
// 		newItem.steps = JSON.stringify( newItem.steps );
// 		newItem.status = ATStatusType.Ready;

// 		return new Promise( ( resolve, reject ) => {
// 			this.db.query( 'INSERT INTO schedules SET ?', newItem, ( err, result, fields ) => {
// 				if ( err ) {
// 					reject( { error: err, message: 'Failed to create a new item.' } );
// 				} else {
// 					resolve( { id: result.insertId } );
// 				}
// 			} );
// 		} );
// 	}
// 	public getOne = ( id: number ) => {
// 		return this.getItemDetails( <DimeSchedule>{ id: id } );
// 	}
// 	public getItemDetails = ( refObj: DimeSchedule ): Promise<DimeSchedule> => {
// 		return new Promise( ( resolve, reject ) => {
// 			this.db.query( 'SELECT * FROM schedules WHERE id = ?', refObj.id, ( err, rows, fields ) => {
// 				if ( err ) {
// 					reject( { error: err, message: 'Retrieving item with id ' + refObj.id + ' has failed' } );
// 				} else if ( rows.length !== 1 ) {
// 					reject( { error: 'Wrong number of records', message: 'Wrong number of records for item received from the server, 1 expected' } );
// 				} else {
// 					rows[0] = this.prepareIndividualItem( rows[0] );
// 					resolve( rows[0] );
// 				}
// 			} );
// 		} );
// 	}
// 	private prepareIndividualItem = ( item: any ): DimeSchedule => {
// 		if ( !item.schedule ) {
// 			item.schedule = JSON.stringify( [{ second: '*', minute: '*', hour: '*', dayofmonth: '*', month: '*', dayofweek: '*' }] );
// 		}
// 		item.schedule = JSON.parse( item.schedule );

// 		if ( !item.steps ) {
// 			item.steps = JSON.stringify( [{ type: 0, referedid: 0, position: 0 }] );
// 		}
// 		item.steps = JSON.parse( item.steps );

// 		item.steps.sort( SortByPosition );

// 		if ( !item.status ) {
// 			item.status = ATStatusType.Ready;
// 		}

// 		if ( item.tags ) {
// 			item.tags = JSON.parse( item.tags );
// 		} else {
// 			item.tags = {};
// 		}
// 		return <DimeSchedule>item;
// 	}
// 	public update = ( item: DimeSchedule ) => {
// 		const curItem = <any>item;
// 		if ( !curItem.schedule ) {
// 			curItem.schedule = [];
// 		}
// 		curItem.schedule = JSON.stringify( curItem.schedule );

// 		if ( !curItem.steps ) {
// 			curItem.steps = [];
// 		}
// 		curItem.steps.forEach( step => {
// 			step.referedid = parseInt( step.referedid, 10 );
// 			step.type = parseInt( step.type, 10 );
// 			step.position = parseInt( step.position, 10 );
// 		} );
// 		curItem.steps = JSON.stringify( curItem.steps );

// 		curItem.tags = JSON.stringify( curItem.tags );

// 		delete curItem.status;
// 		return new Promise( ( resolve, reject ) => {
// 			this.db.query( 'UPDATE schedules SET ? WHERE id = ' + item.id, curItem, ( err, result, fields ) => {
// 				if ( err ) {
// 					reject( { error: err, message: 'Failed to update the item' } );
// 				} else {
// 					resolve();
// 				}
// 			} );
// 		} );
// 	}
// 	public unlock = ( id: number ) => {
// 		return this.setStatus( id, ATStatusType.Ready );
// 	}
// 	public setStatus = ( id: number, status: ATStatusType ) => {
// 		return new Promise( ( resolve, reject ) => {
// 			this.db.query( 'UPDATE schedules SET ? WHERE id = ?', [{ status: status }, id], ( err, result, fields ) => {
// 				if ( err ) {
// 					reject( err );
// 				} else {
// 					resolve( id );
// 				}
// 			} );
// 		} );
// 	}
// 	public getStatus = ( id: number ) => {
// 		return new Promise( ( resolve, reject ) => {
// 			this.db.query( 'SELECT status FROM schedules WHERE id = ?', id, ( err, result, fields ) => {
// 				if ( err ) {
// 					reject( err );
// 				} else if ( result.length !== 1 ) {
// 					reject( 'Not correct number of records' );
// 				} else {
// 					resolve( <ATStatusType>result[0].status );
// 				}
// 			} );
// 		} );
// 	}
// 	public delete = ( id: number ) => {
// 		return new Promise( ( resolve, reject ) => {
// 			this.db.query( 'DELETE FROM schedules WHERE id = ?', id, ( err, result, fields ) => {
// 				if ( err ) {
// 					reject( { error: err, message: 'Failed to delete the item' } );
// 				} else {
// 					resolve( { id: id } );
// 				}
// 			} );
// 		} );
// 	}
// 	public run = ( id: number ) => {
// 		let logid: number; logid = 0;
// 		this.logTool.openLog( 'Initiating schedule', 0, 'schedule', id ).
// 			then( ( retlog: number ) => {
// 				logid = retlog;
// 				return this.runInitiate( id, logid );
// 			} ).
// 			then( this.getOne ).
// 			then( ( item: DimeSchedule ) => {
// 				return this.runSteps( item, logid );
// 			} ).
// 			then( () => {
// 				return this.runClose( id, logid );
// 			} ).
// 			catch( ( error ) => {
// 				console.log( error );
// 				this.logTool.closeLog( logid ).
// 					catch( ( logerror ) => {
// 						console.log( '===========================================' );
// 						console.log( '===========================================' );
// 						console.log( logerror );
// 						console.log( '===========================================' );
// 						console.log( '===========================================' );
// 					} );
// 				this.runClose( id, logid ).catch( console.log );
// 			} );
// 	}
// 	private runInitiate = ( id: number, logid: number ) => {
// 		return new Promise( ( resolve, reject ) => {
// 			this.logTool.appendLog( logid, 'Initiate sequence started' ).
// 				then( () => {
// 					return this.getStatus( id );
// 				} ).
// 				then( ( result: ATStatusType ) => {
// 					if ( result !== ATStatusType.Ready ) {
// 						return Promise.reject( 'Schedule is already running' );
// 					} else {
// 						return this.setStatus( id, ATStatusType.Running );
// 					}
// 				} ).
// 				then( resolve ).
// 				catch( reject );
// 		} );
// 	}
// 	private runSteps = ( schedule: DimeSchedule, logid: number ) => {
// 		return new Promise( ( resolve, reject ) => {
// 			this.logTool.appendLog( logid, 'Running steps' ).
// 				then( () => {
// 					async.eachOfSeries(
// 						schedule.steps,
// 						( item, key, callback ) => {
// 							this.runStep( item, key, logid ).then( () => { callback(); } ).catch( callback );
// 						},
// 						( error ) => {
// 							if ( error ) {
// 								reject( error );
// 							} else {
// 								resolve( schedule.id );
// 							}
// 						}
// 					);
// 				} ).
// 				catch( reject );
// 		} );
// 	}
// 	private runStep = ( step: DimeScheduleStep, key: number | string, logid: number ) => {
// 		return new Promise( ( resolve, reject ) => {
// 			this.logTool.appendLog( logid, 'Running Step:' + key ).
// 				then( () => {
// 					if ( step.type === DimeScheduleStepType.Process ) {
// 						return this.processTool.runAndWait( step.referedid );
// 					} else {
// 						return Promise.reject( 'Not a ready to use step type' );
// 					}
// 				} ).
// 				then( resolve ).
// 				catch( reject );
// 		} );
// 	}
// 	private runClose = ( id: number, logid: number ) => {
// 		return new Promise( ( resolve, reject ) => {
// 			this.logTool.appendLog( logid, 'Steps are all run, closing the schedule' ).
// 				then( () => {
// 					return this.setStatus( id, ATStatusType.Ready );
// 				} ).
// 				then( () => {
// 					return this.logTool.closeLog( logid );
// 				} ).
// 				then( resolve ).
// 				catch( error => {
// 					console.log( '===========================================' );
// 					console.log( '===========================================' );
// 					console.log( error );
// 					console.log( '===========================================' );
// 					console.log( '===========================================' );
// 				} );
// 		} );
// 	}
// }
