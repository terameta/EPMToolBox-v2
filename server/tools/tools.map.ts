import { DB } from './tools.db';
import { MainTools } from './tools.main';
import { ATMap } from 'shared/models/at.map';
import { ATTuple } from 'shared/models/at.tuple';

export class MapTool {

	constructor( private db: DB, private tools: MainTools ) { }

	public getAll = async (): Promise<ATMap[]> => {
		console.log( '===========================================' );
		console.log( '===========================================' );
		console.log( 'Remember to update the maps table using mapfields etc.' );
		console.log( '===========================================' );
		console.log( '===========================================' );
		const { tuples } = await this.db.query<ATTuple>( 'SELECT * FROM maps' );
		return tuples.map( t => this.tools.prepareTupleToRead<ATMap>( t ) );
	}

	public getOne = async ( id: number ): Promise<ATMap> => {
		const { tuple } = await this.db.queryOne<ATTuple>( 'SELECT * FROM maps WHERE id = ?', id );
		return this.tools.prepareTupleToRead<ATMap>( tuple );
	}

	public create = async (): Promise<ATMap> => {
		const newMap = <ATMap>{ name: 'New Map' };
		const { tuple } = await this.db.queryOne<any>( 'INSERT INTO maps SET ?', this.tools.prepareTupleToWrite( newMap ) );
		newMap.id = tuple.insertId;
		return newMap;
	}

	public update = async ( payload: ATMap ) => {
		await this.db.queryOne( 'UPDATE maps SET ? WHERE id = ?', [this.tools.prepareTupleToWrite( payload ), payload.id] );
	}

	public delete = async ( id: number ) => {
		await this.db.query( 'DELETE FROM maps WHERE id = ?', id );
	}
}
// import { Pool } from 'mysql';
// const excel = require( 'exceljs' );
// const streamBuffers = require( 'stream-buffers' );
// import { Readable } from 'stream';
// import * as fs from 'fs';

// import { MainTools } from './tools.main';
// import { StreamTools } from './tools.dime.stream';
// import { MailTool } from './tools.mailer';

// import { DimeMap, DimeMapField } from '../../shared/model/dime/map';
// import { DimeStream } from '../../shared/model/dime/stream';
// import { DimeStreamField } from '../../shared/model/dime/streamfield';
// import { EnvironmentTools } from './tools.dime.environment';
// import { DimeEnvironment } from '../../shared/model/dime/environment';
// import { DimeEnvironmentDetail } from '../../shared/model/dime/environmentDetail';
// import { DimeEnvironmentType } from '../../shared/enums/dime/environmenttypes';
// import { ATReadyStatus } from '../../shared/enums/generic/readiness';
// import { DimeStreamType } from '../../shared/enums/dime/streamtypes';

// export class MapTools {
// 	private streamTool: StreamTools;
// 	private environmentTool: EnvironmentTools;
// 	private mailTool: MailTool;
// 	constructor(
// 		public db: Pool,
// 		public tools: MainTools ) {
// 		this.streamTool = new StreamTools( this.db, this.tools );
// 		this.environmentTool = new EnvironmentTools( this.db, this.tools );
// 		this.mailTool = new MailTool( this.db, this.tools );
// 	}

// 	public getAll = (): Promise<DimeMap[]> => {
// 		return new Promise( ( resolve, reject ) => {
// 			this.db.query( 'SELECT * FROM maps', ( err, rows: DimeMap[], fields ) => {
// 				if ( err ) {
// 					reject( { error: err, message: 'Failed to get maps.' } );
// 				} else {
// 					const promises: Promise<DimeMap>[] = [];
// 					rows.forEach( curMap => {
// 						promises.push( this.prepareOne( curMap ) );
// 					} );
// 					resolve( Promise.all( promises ) );
// 				}
// 			} );
// 		} );
// 	}
// 	public getOne = ( id: number ) => {
// 		return new Promise( ( resolve, reject ) => {
// 			this.db.query( 'SELECT * FROM maps WHERE id = ?', id, ( err, rows, fields ) => {
// 				if ( err ) {
// 					reject( err );
// 				} else if ( rows.length !== 1 ) {
// 					reject( new Error( 'Wrong number of records for map received from the server, 1 expected' ) );
// 				} else {
// 					resolve( this.prepareOne( rows[0] ) );
// 				}
// 			} );
// 		} );
// 	}
// 	private prepareOne = ( dimeMap: DimeMap ): Promise<DimeMap> => {
// 		return this.getFields( dimeMap.id )
// 			.then( fields => {
// 				dimeMap.sourcefields = fields.filter( curField => curField.srctar === 'source' );
// 				dimeMap.targetfields = fields.filter( curField => curField.srctar === 'target' );
// 				dimeMap.tags = JSON.parse( dimeMap.tags );
// 				if ( !dimeMap.tags ) { dimeMap.tags = {}; }
// 				return dimeMap;
// 			} );
// 	}
// 	public create = () => {
// 		return new Promise( ( resolve, reject ) => {
// 			let newMap: any = {};
// 			newMap = { name: 'New Map' };
// 			this.db.query( 'INSERT INTO maps SET ?', { name: 'New Map' }, ( err, rows, fields ) => {
// 				if ( err ) {
// 					reject( { error: err, message: 'Failed to create a new map.' } );
// 				} else {
// 					newMap.id = rows.insertId;
// 					resolve( newMap );
// 				}
// 			} );
// 		} );
// 	}
// 	public update = ( dimeMap: DimeMap ) => {
// 		return new Promise( ( resolve, reject ) => {
// 			this.setFields( dimeMap )
// 				.then( resMap => {
// 					delete resMap.isready;
// 					delete resMap.sourcefields;
// 					delete resMap.targetfields;
// 					delete resMap.mapData;
// 					delete resMap.isMapDataRefreshing;
// 					resMap.tags = JSON.stringify( resMap.tags );
// 					this.db.query( 'UPDATE maps SET ? WHERE id = ?', [resMap, resMap.id], ( err, rows, fields ) => {
// 						if ( err ) {
// 							reject( err );
// 						} else {
// 							resolve( dimeMap );
// 						}
// 					} );
// 				} );
// 		} );
// 	}
// 	public delete = ( id: number ) => {
// 		return new Promise( ( resolve, reject ) => {
// 			this.db.query( 'DELETE FROM maps WHERE id = ?', id, ( err, rows, fields ) => {
// 				if ( err ) {
// 					reject( { error: err, message: 'Failed to delete the map.' } );
// 				} else {
// 					resolve( id );
// 				}
// 			} );
// 		} );
// 	}
// 	public getFields = ( id: number ): Promise<DimeMapField[]> => {
// 		return new Promise( ( resolve, reject ) => {
// 			this.db.query( 'SELECT * FROM mapfields WHERE map = ?', id, ( err, rows: DimeMapField[], fields ) => {
// 				if ( err ) {
// 					reject( err );
// 				} else {
// 					resolve( rows );
// 				}
// 			} );
// 		} );
// 	}
// 	public setFields = ( dimeMap: DimeMap ): Promise<DimeMap> => {
// 		return new Promise( ( resolve, reject ) => {
// 			if ( !dimeMap ) {
// 				reject( new Error( 'No information passed.' ) );
// 			} else if ( !dimeMap.id ) {
// 				reject( new Error( 'No map id passed.' ) );
// 			} else {
// 				this.db.query( 'DELETE FROM mapfields WHERE map = ?', dimeMap.id, ( err, rows, fields ) => {
// 					if ( err ) {
// 						reject( err );
// 					} else {
// 						let promises: any[];
// 						promises = [];
// 						if ( dimeMap.sourcefields ) {
// 							dimeMap.sourcefields.forEach( ( curField ) => {
// 								promises.push( this.setFieldsAction( dimeMap.id, 'source', curField.name ) );
// 							} );
// 						}
// 						if ( dimeMap.targetfields ) {
// 							dimeMap.targetfields.forEach( ( curField ) => {
// 								promises.push( this.setFieldsAction( dimeMap.id, 'target', curField.name ) );
// 							} );
// 						}
// 						Promise.all( promises ).then( () => resolve( dimeMap ) ).catch( reject );
// 					}
// 				} );
// 			}
// 		} );
// 	}
// 	private setFieldsAction = ( map: number, srctar: 'source' | 'target', name: string ) => {
// 		return new Promise( ( resolve, reject ) => {
// 			this.db.query( 'INSERT INTO mapfields SET ?', { map, srctar, name }, ( err, rows, fields ) => {
// 				if ( err ) {
// 					reject( err );
// 				} else {
// 					resolve( rows );
// 				}
// 			} );
// 		} );
// 	}
// 	public prepare = ( id: number ) => {
// 		return new Promise( ( resolve, reject ) => {
// 			this.prepareFields( id ).
// 				then( ( refObj: any ) => {
// 					let createQueries: any;
// 					createQueries = {};
// 					createQueries.maptbl = 'CREATE TABLE MAP' + refObj.id + '_MAPTBL (id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT';
// 					createQueries.drops = [];
// 					createQueries.drops.push( 'DROP TABLE IF EXISTS MAP' + refObj.id + '_MAPTBL' );
// 					refObj.fields.forEach( ( curField: any ) => {
// 						let curPrefix = '';
// 						let curFieldDef = '';
// 						if ( curField.srctar === 'source' ) { curPrefix = 'SRC_'; }
// 						if ( curField.srctar === 'target' ) { curPrefix = 'TAR_'; }
// 						curFieldDef = ', ' + curPrefix + curField.name;
// 						if ( curField.type === 'string' && ( curField.environmentType === 'RDBT' || curField.environmentType === 'RDBS' ) ) {
// 							curFieldDef += ' VARCHAR(' + curField.fCharacters + ')';
// 						}
// 						if ( curField.type === 'number' && ( curField.environmentType === 'RDBT' || curField.environmentType === 'RDBS' ) ) {
// 							curFieldDef += ' NUMERIC(' + curField.fPrecision + ',' + curField.fDecimals + ')';
// 						}
// 						if ( curField.type === 'date' && ( curField.environmentType === 'RDBT' || curField.environmentType === 'RDBS' ) ) {
// 							curFieldDef += ' DATETIME';
// 						}
// 						if ( curField.environmentType === 'HPDB' ) {
// 							curFieldDef += ' VARCHAR(80)';
// 						}
// 						if ( curField.mappable ) { createQueries.maptbl += curFieldDef + ', INDEX (' + curPrefix + curField.name + ')'; }
// 					} );
// 					createQueries.maptbl += ', PRIMARY KEY(id) );';
// 					refObj.queries = createQueries;
// 					return refObj;
// 				} ).
// 				then( ( refObj: any ) => {
// 					return new Promise( ( tResolve, tReject ) => {
// 						let promises: any[];
// 						promises = [];
// 						refObj.queries.drops.forEach( ( curQuery: any ) => {
// 							promises.push( new Promise( ( iresolve, ireject ) => {
// 								this.db.query( curQuery, function ( err, rows, fields ) {
// 									if ( err ) {
// 										ireject( err );
// 									} else {
// 										iresolve( rows );
// 									}
// 								} );
// 							} ) );
// 						} );
// 						Promise.all( promises ).then( function ( result ) {
// 							tResolve( refObj );
// 						} ).catch( tReject );
// 					} );
// 				} ).
// 				then( ( refObj: any ) => {
// 					return new Promise( ( tResolve, tReject ) => {
// 						delete refObj.queries.drops;
// 						let promises: any[];
// 						promises = [];
// 						Object.keys( refObj.queries ).forEach( ( curQuery ) => {
// 							promises.push( new Promise( ( iresolve, ireject ) => {
// 								this.db.query( refObj.queries[curQuery], function ( err, rows, fields ) {
// 									if ( err ) {
// 										ireject( err );
// 									} else {
// 										iresolve( rows );
// 									}
// 								} );
// 							} ) );
// 						} );
// 						Promise.all( promises ).then( function ( result ) {
// 							tResolve( refObj );
// 						} ).catch( tReject );
// 					} );
// 				} ).
// 				then( () => {
// 					resolve( { result: 'OK' } );
// 				} ).
// 				catch( reject );
// 		} );
// 	}
// 	private prepareFields = ( id: number ) => {
// 		let refObj: any;
// 		refObj = {};
// 		return new Promise( ( resolve, reject ) => {
// 			this.getOne( id ).
// 				then( ( curMap: DimeMap ) => {
// 					refObj = curMap;
// 					return this.streamTool.getOne( refObj.source );
// 				} ).
// 				then( ( sourceStream: DimeStream ) => {
// 					refObj.sourceDetails = sourceStream;
// 					return this.streamTool.getOne( refObj.target );
// 				} ).
// 				then( ( targetStream: DimeStream ) => {
// 					refObj.targetDetails = targetStream;
// 					return this.streamTool.retrieveFields( refObj.source );
// 				} ).
// 				then( ( sourceStreamFields ) => {
// 					refObj.sourceFields = sourceStreamFields;
// 					return this.streamTool.retrieveFields( refObj.target );
// 				} ).
// 				then( ( targetStreamFields ) => {
// 					refObj.targetFields = targetStreamFields;
// 					return this.getFields( refObj.id );
// 				} ).
// 				then( ( mapFields ) => {
// 					refObj.mapFields = mapFields;
// 					refObj.sourceDetails.typeName = DimeStreamType[refObj.sourceDetails.type];
// 					refObj.sourceDetails.typeValue = DimeStreamType[refObj.sourceDetails.type];
// 					refObj.targetDetails.typeName = DimeStreamType[refObj.targetDetails.type];
// 					refObj.targetDetails.typeValue = DimeStreamType[refObj.targetDetails.type];
// 					return refObj;
// 				} ).
// 				then( () => {
// 					refObj.fields = [];
// 					refObj.sourceFields.sort( this.fieldSort );
// 					refObj.targetFields.sort( this.fieldSort );
// 					refObj.sourceFields.forEach( ( curField: any ) => {
// 						curField.srctar = 'source';
// 						curField.environmentType = refObj.sourceDetails.typeValue;
// 						refObj.fields.push( curField );
// 					} );
// 					refObj.targetFields.forEach( ( curField: any ) => {
// 						curField.srctar = 'target';
// 						curField.environmentType = refObj.targetDetails.typeValue;
// 						refObj.fields.push( curField );
// 					} );
// 					refObj.fields.forEach( ( curField: any ) => {
// 						curField.mappable = false;
// 						refObj.mapFields.forEach( ( curMapField: any ) => {
// 							if ( curMapField.srctar === curField.srctar && curMapField.name === curField.name ) {
// 								curField.mappable = true;
// 							}
// 						} );
// 					} );
// 					return refObj;
// 				} ).
// 				then( resolve ).
// 				catch( reject );
// 		} );
// 	}
// 	private fieldSort( a: any, b: any ) {
// 		if ( a.fOrder < b.fOrder ) {
// 			return -1;
// 		} else if ( a.fOrder > b.fOrder ) {
// 			return 1;
// 		} else {
// 			return 0;
// 		}
// 	}
// 	public isReady = ( id: number ): Promise<{ isready: ATReadyStatus }> => {
// 		return new Promise( ( resolve, reject ) => {
// 			let maptblExists: boolean; maptblExists = false;
// 			let descriptivetblExists: any; descriptivetblExists = {};
// 			const systemDBName = this.tools.config.mysql.db;
// 			this.prepareFields( id )
// 				.then( ( refObj: any ) => {
// 					this.db.query( 'SELECT * FROM information_schema.tables WHERE table_schema = ? AND table_name LIKE ?', [systemDBName, 'MAP' + refObj.id + '_%'], ( err, rows, fields ) => {
// 						if ( err ) {
// 							reject( err );
// 						} else if ( rows.length === 0 ) {
// 							resolve( { isready: ATReadyStatus.NotReady } );
// 						} else {
// 							rows.forEach( ( curTable: any ) => {
// 								if ( curTable.TABLE_NAME === 'MAP' + refObj.id + '_MAPTBL' ) { maptblExists = true; }
// 							} );
// 							let numSrcFields = 0;
// 							let numTarFields = 0;
// 							refObj.mapFields.forEach( ( curField: any ) => {
// 								if ( curField.srctar === 'source' ) { numSrcFields++; }
// 								if ( curField.srctar === 'target' ) { numTarFields++; }
// 							} );
// 							if ( maptblExists && numSrcFields > 0 && numTarFields > 0 ) {
// 								resolve( { isready: ATReadyStatus.Ready } );
// 							} else {
// 								resolve( { isready: ATReadyStatus.NotReady } );
// 							}
// 						}
// 					} );

// 				} )
// 				.catch( reject );
// 		} );
// 	}
// 	public rejectIfNotReady = ( id: number ) => {
// 		return new Promise( ( resolve, reject ) => {
// 			this.isReady( id ).
// 				then( isReady => {
// 					if ( isReady.isready ) {
// 						resolve( id );
// 					} else {
// 						reject( 'Map is not ready' );
// 					}
// 				} ).
// 				catch( reject );
// 		} );
// 	}
// 	public retrieveMapData = ( refObj: any ) => {
// 		return this.retrieveMapDataAction( refObj ).then( ( result: any ) => result.map );
// 	}
// 	private retrieveMapDataAction = ( refObj: any ) => {
// 		return new Promise( ( resolve, reject ) => {
// 			let curMap: DimeMap; curMap = <DimeMap>{ id: 0, name: '' };
// 			let mapFields: any[]; mapFields = [];
// 			let finalFields: any[]; finalFields = [];
// 			let sourceFields: DimeStreamField[]; sourceFields = [];
// 			let targetFields: DimeStreamField[]; targetFields = [];
// 			let sourceStream: DimeStream; sourceStream = <DimeStream>{ id: 0, name: '', type: 0, environment: 0 };
// 			let targetStream: DimeStream; targetStream = <DimeStream>{ id: 0, name: '', type: 0, environment: 0 };
// 			let sourceEnvironment: DimeEnvironmentDetail; sourceEnvironment = <DimeEnvironmentDetail>{ id: 0 };
// 			let targetEnvironment: DimeEnvironmentDetail; targetEnvironment = <DimeEnvironmentDetail>{ id: 0 };

// 			this.getOne( refObj.id ).
// 				then( ( theMap: DimeMap ) => {
// 					curMap = theMap;
// 					return this.streamTool.retrieveFields( curMap.source || 0 );
// 				} ).
// 				then( ( srcFields: DimeStreamField[] ) => {
// 					// console.log(new Date(), 'Received source fields');
// 					sourceFields = srcFields;
// 					return this.streamTool.retrieveFields( curMap.target || 0 );
// 				} ).
// 				then( ( tarFields: DimeStreamField[] ) => {
// 					// console.log(new Date(), 'Received target fields');
// 					targetFields = tarFields;
// 					return this.streamTool.getOne( curMap.source || 0 );
// 				} ).
// 				then( ( srcStream: DimeStream ) => {
// 					// console.log(new Date(), 'Received source stream');
// 					sourceStream = srcStream;
// 					return this.streamTool.getOne( curMap.target || 0 );
// 				} ).
// 				then( ( tarStream: DimeStream ) => {
// 					// console.log(new Date(), 'Received target stream');
// 					targetStream = tarStream;
// 					return this.environmentTool.getEnvironmentDetails( <DimeEnvironmentDetail>{ id: sourceStream.environment } );
// 				} ).
// 				then( ( srcEnvironment: DimeEnvironmentDetail ) => {
// 					// console.log(new Date(), 'Received source environment');
// 					sourceEnvironment = srcEnvironment;
// 					return this.environmentTool.getEnvironmentDetails( <DimeEnvironmentDetail>{ id: targetStream.environment } );
// 				} ).
// 				then( ( tarEnvironment: DimeEnvironmentDetail ) => {
// 					// console.log(new Date(), 'Received target environment');
// 					targetEnvironment = tarEnvironment;
// 					return this.getFields( curMap.id );
// 				} ).
// 				then( ( mapFieldList: any ) => {
// 					mapFields = mapFieldList;
// 					return 'OK';
// 				} ).
// 				then( () => {
// 					if ( !sourceEnvironment.type ) {
// 						reject( 'Source environment details are not valid.' );
// 					} else if ( !targetEnvironment.type ) {
// 						reject( 'Target environment details are not valid.' );
// 					} else {
// 						sourceFields.forEach( ( curField ) => {
// 							mapFields.forEach( ( mapField ) => {
// 								if ( sourceEnvironment.type && mapField.srctar === 'source' && mapField.name === curField.name ) {
// 									// console.log(curField.name, curField.isDescribed, sourceEnvironment.typedetails.value);
// 									finalFields.push( {
// 										id: curField.id, name: curField.name, srctar: mapField.srctar, type: 'main', table: 'MAP' + curMap.id + '_MAPTBL'
// 									} );
// 									if ( curField.isDescribed || sourceEnvironment.type === DimeEnvironmentType.HP || sourceEnvironment.type === DimeEnvironmentType.PBCS ) {
// 										finalFields.push( { id: curField.id, name: curField.name, srctar: mapField.srctar, type: 'description', table: 'STREAM' + sourceStream.id + '_DESCTBL' + curField.id } );
// 									}
// 								}
// 							} );
// 						} );
// 						targetFields.forEach( ( curField ) => {
// 							mapFields.forEach( ( mapField ) => {
// 								if ( targetEnvironment.type && mapField.srctar === 'target' && mapField.name === curField.name ) {
// 									// console.log(curField.name, curField.isDescribed, targetEnvironment.typedetails.value);
// 									finalFields.push( { id: curField.id, name: curField.name, srctar: mapField.srctar, type: 'main', table: 'MAP' + curMap.id + '_MAPTBL' } );
// 									if ( curField.isDescribed || sourceEnvironment.type === DimeEnvironmentType.HP || sourceEnvironment.type === DimeEnvironmentType.PBCS ) {
// 										finalFields.push( { id: curField.id, name: curField.name, srctar: mapField.srctar, type: 'description', table: 'STREAM' + targetStream.id + '_DESCTBL' + curField.id } );
// 									}
// 								}
// 							} );
// 						} );
// 						let selectQuery: string; selectQuery = '';
// 						selectQuery += 'SELECT MAP' + curMap.id + '_MAPTBL.id, ';
// 						selectQuery += finalFields.map( ( curField ) => {
// 							let toReturn: string; toReturn = '\n\t';
// 							if ( curField.type === 'main' ) {
// 								toReturn += curField.table + '.';
// 								toReturn += curField.srctar === 'source' ? 'SRC_' : 'TAR_';
// 								toReturn += curField.name;
// 							} else {
// 								toReturn += curField.table + '.Description';
// 								toReturn += ' AS ';
// 								toReturn += curField.srctar === 'source' ? 'SRC_' : 'TAR_';
// 								toReturn += curField.name;
// 								toReturn += '_DESC';
// 							}
// 							return toReturn;
// 						} ).join( ', ' );
// 						selectQuery += '\n FROM MAP' + curMap.id + '_MAPTBL ';
// 						finalFields.forEach( ( curField ) => {
// 							if ( curField.type === 'description' ) {
// 								selectQuery += '\n\t' + 'LEFT JOIN ';
// 								selectQuery += curField.table;
// 								selectQuery += ' ON ';
// 								selectQuery += 'MAP' + curMap.id + '_MAPTBL.' + ( curField.srctar === 'source' ? 'SRC_' : 'TAR_' ) + curField.name;
// 								selectQuery += ' = ';
// 								selectQuery += curField.table + '.RefField';
// 							}
// 						} );
// 						// console.log( selectQuery );
// 						selectQuery = 'SELECT * FROM (' + selectQuery + ') FSQMAPDESCRIBED \nWHERE 1 = 1';
// 						let wherers: string[]; wherers = [];
// 						let wherevals: any[]; wherevals = [];
// 						if ( refObj.filters ) {
// 							refObj.filters.filter( f => f.value ).forEach( filter => {
// 								switch ( filter.type ) {
// 									case 'is': {
// 										wherers.push( filter.name + ' = ?' );
// 										wherevals.push( filter.value );
// 										break;
// 									}
// 									case 'co': {
// 										wherers.push( filter.name + ' LIKE ?' );
// 										wherevals.push( '%' + filter.value + '%' );
// 										break;
// 									}
// 									case 'bw': {
// 										wherers.push( filter.name + ' LIKE ?' );
// 										wherevals.push( filter.value + '%' );
// 										break;
// 									}
// 									case 'ew': {
// 										wherers.push( filter.name + ' LIKE ?' );
// 										wherevals.push( '%' + filter.value );
// 										break;
// 									}
// 								}
// 							} );
// 						}
// 						wherers.forEach( ( curWhere: string ) => {
// 							selectQuery += '\n\tAND ';
// 							selectQuery += curWhere;
// 						} );
// 						if ( refObj.sorters && refObj.sorters.length > 0 ) {
// 							selectQuery += ' \nORDER BY ';
// 							selectQuery += refObj.sorters
// 								.map( currentSorter => ( '\n\t' + currentSorter.type + '_' + currentSorter.name + ' ' + ( currentSorter.isAsc ? 'ASC' : 'DESC' ) ) )
// 								.join( ', ' );
// 						}
// 						this.db.query( selectQuery, wherevals, ( err, result, fields ) => {
// 							if ( err ) {
// 								reject( err );
// 							} else {
// 								refObj.map = result;
// 								refObj.finalFields = finalFields;
// 								resolve( refObj );
// 							}
// 						} );
// 					}
// 				} ).
// 				catch( reject );
// 		} );
// 	}
// 	public saveMapTuple = ( payload: { mapid: number, tuple: any } ) => {
// 		delete payload.tuple.matrixresult;
// 		delete payload.tuple.saveresult;
// 		return new Promise( ( resolve, reject ) => {
// 			this.db.query( 'UPDATE MAP' + payload.mapid + '_MAPTBL SET ? WHERE id = ?', [payload.tuple, payload.tuple.id], ( err, result, fields ) => {
// 				if ( err ) {
// 					reject( err );
// 				} else {
// 					resolve( { result: 'OK' } );
// 				}
// 			} );
// 		} );
// 	}
// 	public deleteMapTuple = ( refObj: { mapid: number, tupleid: number } ) => {
// 		return new Promise( ( resolve, reject ) => {
// 			this.db.query( 'DELETE FROM MAP' + refObj.mapid + '_MAPTBL WHERE id = ?', refObj.tupleid, ( err, result, fields ) => {
// 				if ( err ) {
// 					reject( err );
// 				} else {
// 					resolve( { result: 'OK' } );
// 				}
// 			} );
// 		} );
// 	}
// 	public mapImport = ( refObj: any ) => {
// 		return new Promise( ( resolve, reject ) => {
// 			// console.log( refObj );
// 			if ( !refObj ) {
// 				reject( 'No data is provided' );
// 			} else if ( !refObj.body ) {
// 				reject( 'No body is provided' );
// 			} else if ( !refObj.body.id ) {
// 				reject( 'No map id is provided' );
// 			} else if ( !refObj.files ) {
// 				reject( 'No files are uploaded' );
// 			} else if ( !Array.isArray( refObj.files ) ) {
// 				reject( 'File list is not proper' );
// 			} else if ( refObj.files.length !== 1 ) {
// 				reject( 'System is expecting exactly one files. Wrong number of files are received.' );
// 			} else {
// 				let workbook: any; workbook = new excel.Workbook();
// 				let myReadableStreamBuffer: any; myReadableStreamBuffer = new streamBuffers.ReadableStreamBuffer();
// 				myReadableStreamBuffer.put( refObj.files[0].buffer );
// 				myReadableStreamBuffer.stop();
// 				let toInsert: any[];
// 				workbook.xlsx.read( myReadableStreamBuffer ).
// 					then( this.mapImportGetExcelData ).
// 					then( ( tuples: any[] ) => {
// 						toInsert = tuples;
// 						return this.clearMapTable( refObj.body.id );
// 					} ).
// 					then( () => {
// 						return this.populateMapTable( refObj.body.id, toInsert );
// 					} ).
// 					then( resolve ).
// 					catch( reject );
// 			}
// 		} );
// 	}
// 	public mapImportGetExcelData = ( workbook: any ) => {
// 		return new Promise( ( resolve, reject ) => {
// 			const colHeaders: string[] = [];
// 			const colTypes: number[] = [];
// 			const tuples: any[] = [];
// 			let curTuple: any;
// 			let curIndex: number;
// 			if ( workbook.worksheets.length !== 1 ) {
// 				reject( 'System is expecting exactly one sheet in the workbook. Wrong number of sheets are received.' );
// 			} else if ( workbook.worksheets[0].rowCount < 3 ) {
// 				reject( 'System is expecting at least 3 rows in the excel sheet. Wrong number of rows are received.' );
// 			} else {
// 				workbook.eachSheet( ( worksheet: any, sheetId: any ) => {
// 					worksheet.eachRow( ( row: any, rowNumber: number ) => {
// 						curTuple = {};
// 						if ( rowNumber === 1 ) {
// 							row.eachCell( ( cell: any, colNumber: number ) => {
// 								colHeaders.push( cell.value );
// 							} );
// 						} else if ( rowNumber === 2 ) {
// 							row.eachCell( ( cell: any, colNumber: number ) => {
// 								colTypes.push( cell.value );
// 							} );
// 						} else {
// 							row.eachCell( ( cell: any, colNumber: number ) => {
// 								curIndex = colNumber - 1;
// 								if ( colTypes[curIndex] === 2 ) {
// 									curTuple[colHeaders[curIndex]] = cell.value;
// 								}
// 							} );
// 							tuples.push( curTuple );
// 						}
// 					} );
// 				} );
// 				if ( tuples.length === 0 ) {
// 					reject( 'No map data is found.' );
// 				} else {
// 					resolve( tuples );
// 				}
// 			}
// 		} );
// 	}
// 	public clearMapTable = ( id: number ) => {
// 		return new Promise( ( resolve, reject ) => {
// 			this.db.query( 'TRUNCATE MAP' + id + '_MAPTBL', ( err, result, fields ) => {
// 				if ( err ) {
// 					reject( err );
// 				} else {
// 					resolve();
// 				}
// 			} );
// 		} );
// 	}
// 	public populateMapTable = ( id: number, tuples: any[] ) => {
// 		return new Promise( ( resolve, reject ) => {
// 			const curKeys = Object.keys( tuples[0] );
// 			let curArray: any[];
// 			tuples.forEach( ( curResult, curItem ) => {
// 				curArray = [];
// 				curKeys.forEach( ( curKey ) => {
// 					curArray.push( curResult[curKey] );
// 				} );
// 				tuples[curItem] = curArray;
// 			} );
// 			this.db.query( 'INSERT INTO MAP' + id + '_MAPTBL (' + curKeys.join( ', ' ) + ') VALUES ?', [tuples], ( err, result, fields ) => {
// 				if ( err ) {
// 					reject( err );
// 				} else {
// 					resolve( id );
// 				}
// 			} );
// 		} );
// 	}
// 	public mapExport = ( refObj: { id: number, requser: any, res: any } ) => {
// 		return new Promise( ( resolve, reject ) => {
// 			this.getOne( refObj.id ).
// 				then( ( curMap: any ) => {
// 					curMap.filters = [];
// 					return curMap;
// 				} ).
// 				then( this.retrieveMapDataAction ).
// 				then( this.mapExportConvertToExcel ).
// 				then( ( theStreamBuffer ) => {
// 					return this.mapExportSendToUser( theStreamBuffer, refObj.requser, refObj.res );
// 				} ).
// 				then( resolve ).
// 				catch( reject );
// 		} );
// 	}
// 	private mapExportConvertToExcel = ( refObj: any ) => {
// 		return new Promise( ( resolve, reject ) => {

// 			let workbook: any; workbook = new excel.Workbook();
// 			workbook.creator = 'EPM ToolBox';
// 			workbook.lastModifiedBy = 'EPM ToolBox';
// 			workbook.created = new Date();
// 			workbook.modified = new Date();

// 			let sheet: any; sheet = workbook.addWorksheet( refObj.name, { views: [{ state: 'frozen', xSplit: 1, ySplit: 1, activeCell: 'A1' }] } );
// 			if ( !refObj.map ) {
// 				sheet.addRow( ['There is no map data produced. If in doubt, please contact system admin!'] );
// 			} else if ( refObj.map.length === 0 ) {
// 				sheet.addRow( ['There is no map data produced. If in doubt, please contact system admin.'] );
// 			} else {
// 				let curColumns: any[]; curColumns = [{ header: 'id', key: 'id' }];
// 				let mapIdentifiers: any; mapIdentifiers = { id: 1 };
// 				let curPrefix = '';
// 				let curSuffix = '';
// 				let curColumn = '';
// 				let curIdentifier = 0;
// 				refObj.finalFields.forEach( ( curField: any ) => {
// 					curPrefix = '';
// 					curSuffix = '';
// 					curColumn = '';
// 					curIdentifier = 0;
// 					if ( curField.srctar === 'source' ) { curPrefix = 'SRC_'; }
// 					if ( curField.srctar === 'target' ) { curPrefix = 'TAR_'; }
// 					if ( curField.type === 'description' ) { curSuffix = '_DESC'; }
// 					if ( curField.type === 'main' ) { curIdentifier = 2; }
// 					curColumn = curPrefix + curField.name + curSuffix;
// 					curColumns.push( { header: curColumn, key: curColumn } );
// 					mapIdentifiers[curColumn] = curIdentifier;
// 				} );
// 				sheet.columns = curColumns;
// 				sheet.addRow( mapIdentifiers );
// 				sheet.lastRow.hidden = true;
// 				sheet.addRows( refObj.map );
// 			}
// 			resolve( workbook );
// 		} );
// 	}
// 	private mapExportSendToUser = ( refBook: any, refUser: any, response: any ) => {
// 		return new Promise( ( resolve, reject ) => {
// 			refBook.xlsx.write( response ).then( ( result: any ) => {
// 				response.end();
// 				resolve();
// 			} ).catch( reject );
// 		} );
// 	}
// }
