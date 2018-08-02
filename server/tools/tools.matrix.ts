import { DB } from './tools.db';
import { MainTools } from './tools.main';
import { ATMatrix } from 'shared/models/at.matrix';
import { ATTuple } from '../../shared/models/at.tuple';

export class MatrixTool {
	constructor( private db: DB, private tools: MainTools ) { }

	public getAll = async (): Promise<ATMatrix[]> => {
		const { tuples } = await this.db.query<ATTuple>( 'SELECT * FROM matrices' );
		return tuples.map( t => this.tools.prepareTupleToRead<ATMatrix>( t ) );
	}

	public getOne = async ( id: number ): Promise<ATMatrix> => {
		const { tuple } = await this.db.queryOne<any>( 'SELECT * FROM matrices WHERE id = ?', id );
		return this.tools.prepareTupleToRead<ATMatrix>( tuple );
	}

	public create = async (): Promise<ATMatrix> => {
		const newMatrix = <ATMatrix>{ name: 'New Matrix' };
		const { tuple } = await this.db.queryOne<any>( 'INSERT INTO matrices SET ?', this.tools.prepareTupleToWrite( newMatrix ) );
		newMatrix.id = tuple.insertId;
		return newMatrix;
	}

	public update = async ( payload: ATMatrix ) => {
		await this.db.queryOne( 'UPDATE matrices SET ? WHERE id = ?', [this.tools.prepareTupleToWrite( payload ), payload.id] );
	}

	public delete = async ( id: number ) => {
		await this.db.query( 'DELETE FROM streams WHERE id = ?', id );
	}
}
// import { DimeMatrix, DimeMatrixRefreshPayload } from '../../shared/model/dime/matrix';
// import * as async from 'async';
// import { MainTools } from './tools.main';
// import { Pool } from 'mysql';
// import * as excel from 'exceljs';
// const streamBuffers = require( 'stream-buffers' );
// import { ATReadyStatus, IsReadyPayload } from '../../shared/enums/generic/readiness';
// import * as _ from 'lodash';
// import { StreamTools } from './tools.dime.stream';
// import { DimeStreamField } from '../../shared/model/dime/streamfield';
// import { DimeStreamDetail } from '../../shared/model/dime/stream';

// export class DimeMatrixTool {
// 	private streamTool: StreamTools;

// 	constructor( public db: Pool, public tools: MainTools ) {
// 		this.streamTool = new StreamTools( this.db, this.tools );
// 	}

// 	public getAll = (): Promise<DimeMatrix[]> => {
// 		return new Promise( ( resolve, reject ) => {
// 			this.db.query( 'SELECT * FROM matrices', ( err, rows, fields ) => {
// 				if ( err ) {
// 					reject( { error: err, message: 'Retrieving items has failed' } );
// 				} else {
// 					resolve( rows.map( this.prepareMatrixDetails ) );
// 				}
// 			} );
// 		} );
// 	}
// 	public create = ( sentItem?: DimeMatrix ) => {
// 		if ( sentItem ) { if ( sentItem.id ) { delete sentItem.id; } }
// 		const newItem = this.tools.isEmptyObject( sentItem ) ? { name: 'New Item (Please change name)', stream: 0 } : <any>sentItem;
// 		return new Promise( ( resolve, reject ) => {
// 			this.db.query( 'INSERT INTO matrices SET ?', newItem, function ( err, result, fields ) {
// 				if ( err ) {
// 					reject( { error: err, message: 'Failed to create a new item.' } );
// 				} else {
// 					resolve( { id: result.insertId } );
// 				}
// 			} );
// 		} );
// 	}
// 	public getOne = ( id: number ) => {
// 		return this.getMatrixDetails( <DimeMatrix>{ id: id } );
// 	}
// 	public getMatrixDetails = ( refObj: DimeMatrix ): Promise<DimeMatrix> => {
// 		return new Promise( ( resolve, reject ) => {
// 			this.db.query( 'SELECT * FROM matrices WHERE id = ?', refObj.id, ( err, rows, fields ) => {
// 				if ( err ) {
// 					reject( err );
// 				} else if ( rows.length !== 1 ) {
// 					reject( new Error( 'Wrong number of records@getMatrixDetails' ) );
// 				} else {
// 					resolve( this.prepareMatrixDetails( rows[0] ) );
// 				}
// 			} );
// 		} );
// 	}
// 	private prepareMatrixDetails = ( refObject: any ): DimeMatrix => {
// 		refObject.tags = JSON.parse( refObject.tags );
// 		refObject.fields = JSON.parse( refObject.fields );
// 		if ( !refObject.fields ) { refObject.fields = {}; }
// 		if ( !refObject.tags ) { refObject.tags = {}; }
// 		return Object.assign( <DimeMatrix>{}, refObject );
// 	}
// 	public update = ( refMatrix: DimeMatrix ) => {
// 		const item: any = Object.assign( {}, refMatrix );
// 		item.fields = JSON.stringify( item.fields );
// 		item.tags = JSON.stringify( item.tags );
// 		delete item.isReady;
// 		delete item.notReadyReason;
// 		delete item.fieldDescriptions;
// 		delete item.matrixData;
// 		return new Promise( ( resolve, reject ) => {
// 			this.db.query( 'UPDATE matrices SET ? WHERE id = ' + item.id, item, ( err, result, fields ) => {
// 				if ( err ) {
// 					reject( { error: err, message: 'Failed to update the item' } );
// 				} else {
// 					resolve( { item } );
// 				}
// 			} );
// 		} );
// 	}
// 	public delete = ( id: number ) => {
// 		return new Promise( ( resolve, reject ) => {
// 			this.db.query( 'DELETE FROM matrices WHERE id = ?', id, ( err, result, fields ) => {
// 				if ( err ) {
// 					reject( { error: err, message: 'Failed to delete the item' } );
// 				} else {
// 					resolve( { id: id } );
// 				}
// 			} );
// 		} );
// 	}
// 	public prepareTables = ( id: number ) => {
// 		return new Promise( ( resolve, reject ) => {
// 			let matrix: DimeMatrix;
// 			this.dropTables( id )
// 				.then( this.getOne )
// 				.then( ( resMatrix ) => {
// 					matrix = resMatrix;
// 					return this.streamTool.getOne( matrix.stream );
// 				} )
// 				.then( ( stream ) => {
// 					// console.log( stream );
// 					// console.log( matrix );
// 					const fieldsToMatrix = stream.fieldList.filter( field => matrix.fields[field.id] ).map( field => ( { id: field.id, name: field.name } ) );
// 					// console.log( fieldsToMatrix );
// 					let createQuery = '';
// 					createQuery += 'CREATE TABLE MATRIX' + id + '_MATRIXTBL (';
// 					createQuery += 'id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, \n';
// 					createQuery += fieldsToMatrix.map( curField => curField.name + ' VARCHAR(1024)' ).join( ', \n' );
// 					createQuery += ', PRIMARY KEY (id) )';
// 					// console.log( createQuery );
// 					this.db.query( createQuery, ( err, result, fields ) => {
// 						if ( err ) {
// 							reject( err );
// 						} else {
// 							resolve( { result: 'OK' } );
// 						}
// 					} );
// 				} )
// 				.catch( reject );
// 		} );
// 	}
// 	public isReady = ( id: number ): Promise<IsReadyPayload> => {
// 		return new Promise( ( resolve, reject ) => {
// 			this.getOne( id )
// 				.then( matrix => {
// 					if ( !matrix ) {
// 						resolve( { isready: ATReadyStatus.NotReady, issue: 'No matrix is found with the id: ' + id + '.' } );
// 					} else if ( !matrix.stream ) {
// 						resolve( { isready: ATReadyStatus.NotReady, issue: 'No stream is attached to the matrix.' } );
// 					} else if ( !matrix.fields ) {
// 						resolve( { isready: ATReadyStatus.NotReady, issue: 'No fields are assigned to the matrix.' } );
// 					} else if ( Object.keys( matrix.fields ).length === 0 ) {
// 						resolve( { isready: ATReadyStatus.NotReady, issue: 'No fields are assigned to the matrix.' } );
// 					} else if ( _.values( matrix.fields ).filter( value => value ).length === 0 ) {
// 						resolve( { isready: ATReadyStatus.NotReady, issue: 'No fields are assigned to the matrix.' } );
// 					} else {
// 						const systemDBName = this.tools.config.mysql.db;
// 						this.db.query( 'SELECT * FROM information_schema.tables WHERE table_schema = ? AND table_name LIKE ?', [systemDBName, 'MATRIX' + matrix.id + '_MATRIXTBL'], ( err, rows, fields ) => {
// 							if ( err ) {
// 								reject( err );
// 							} else {
// 								if ( rows.length === 0 ) {
// 									resolve( { isready: ATReadyStatus.NotReady, issue: 'Matrix table is not yet created.' } );
// 								} else {
// 									resolve( { isready: ATReadyStatus.Ready } );
// 								}
// 							}

// 						} );
// 					}
// 				} )
// 				.catch( reject );
// 		} );
// 	}
// 	public dropTables = ( id: number ) => {
// 		return new Promise( ( resolve, reject ) => {
// 			this.db.query( 'DROP TABLE IF EXISTS ??', 'MATRIX' + id + '_MATRIXTBL', ( err, result, fields ) => {
// 				if ( err ) {
// 					reject( err );
// 				} else {
// 					resolve( id );
// 				}
// 			} );
// 		} );
// 	}
// 	public saveMatrixTuple = ( payload: { matrixid: number, tuple: any } ) => {
// 		return new Promise( ( resolve, reject ) => {
// 			// console.log( payload );
// 			let saveQuery: string; saveQuery = '';
// 			if ( payload.tuple.id ) {
// 				saveQuery += 'UPDATE MATRIX' + payload.matrixid + '_MATRIXTBL SET ? WHERE id=' + payload.tuple.id;
// 			} else {
// 				saveQuery += 'INSERT INTO MATRIX' + payload.matrixid + '_MATRIXTBL SET ?';
// 			}
// 			const saverFields: any = {};
// 			Object.keys( payload.tuple ).forEach( ( curFieldName ) => {
// 				if ( curFieldName === 'id' ) {

// 				} else if ( curFieldName.substr( -5 ) === '_DESC' ) {

// 				} else if ( curFieldName === 'saveresult' ) {

// 				} else {
// 					saverFields[curFieldName] = payload.tuple[curFieldName];
// 				}
// 			} );
// 			this.db.query( saveQuery, saverFields, ( err, result, fields ) => {
// 				if ( err ) {
// 					reject( err );
// 				} else {
// 					resolve( result );
// 				}
// 			} );
// 		} );
// 	}
// 	public deleteMatrixTuple = ( payload: { matrixid: number, tupleid: number } ) => {
// 		return new Promise( ( resolve, reject ) => {
// 			this.db.query( 'DELETE FROM MATRIX' + payload.matrixid + '_MATRIXTBL WHERE id = ?', payload.tupleid, ( err, result, fields ) => {
// 				if ( err ) {
// 					reject( err );
// 				} else {
// 					resolve( { result: 'OK' } );
// 				}
// 			} );
// 		} );
// 	}
// 	public getMatrixTable = ( payload: DimeMatrixRefreshPayload ) => {
// 		return this.getMatrixTableAction( payload ).then( ( result ) => result.matrixData );
// 	}
// 	public getMatrixTableAction = ( payload: DimeMatrixRefreshPayload ): Promise<DimeMatrix> => {
// 		return new Promise( ( resolve, reject ) => {
// 			let matrix: DimeMatrix;
// 			let fields: DimeStreamField[];
// 			this.getOne( payload.id )
// 				.then( resMatrix => {
// 					matrix = resMatrix;
// 					return this.streamTool.retrieveFields( matrix.stream );
// 				} )
// 				.then( ( resFields: DimeStreamField[] ) => {
// 					fields = resFields.filter( field => matrix.fields[field.id] );
// 					const matrixTable = 'MATRIX' + payload.id + '_MATRIXTBL';
// 					let selectQuery: string;
// 					selectQuery = 'SELECT * FROM (\n';
// 					selectQuery += '\tSELECT \n\t\t' + matrixTable + '.id';
// 					fields.forEach( field => {
// 						const descTable = 'STREAM' + field.stream + '_DESCTBL' + field.id;
// 						selectQuery += ',\n\t\t';
// 						selectQuery += matrixTable + '.' + field.name;
// 						if ( field.isDescribed ) {
// 							selectQuery += ',\n\t\t';
// 							selectQuery += descTable + '.Description AS ' + field.name + '_DESC';
// 						}
// 					} );
// 					selectQuery += '\n\tFROM ' + matrixTable;
// 					fields.filter( field => field.isDescribed ).forEach( field => {
// 						const descTable = 'STREAM' + field.stream + '_DESCTBL' + field.id;
// 						selectQuery += '\n\tLEFT JOIN ' + descTable;
// 						selectQuery += ' ON ' + descTable + '.RefField = ' + matrixTable + '.' + field.name;
// 					} );
// 					selectQuery += '\n) AS FSQMATRIXDESCRIBED';
// 					const wherers: string[] = [];
// 					const wherevals: any[] = [];
// 					if ( payload.filters ) {
// 						payload.filters.forEach( filter => {
// 							if ( filter.value ) {
// 								switch ( filter.type ) {
// 									case 'is': {
// 										if ( filter.isDescribed ) {
// 											wherers.push( '(' + filter.name + ' = ? OR ' + filter.name + '_DESC = ?)' );
// 											wherevals.push( filter.value );
// 											wherevals.push( filter.value );
// 										} else {
// 											wherers.push( filter.name + ' = ?' );
// 											wherevals.push( filter.value );
// 										}
// 										break;
// 									}
// 									case 'co': {
// 										if ( filter.isDescribed ) {
// 											wherers.push( '(' + filter.name + ' LIKE ? OR ' + filter.name + '_DESC LIKE ?)' );
// 											wherevals.push( '%' + filter.value + '%' );
// 											wherevals.push( '%' + filter.value + '%' );
// 										} else {
// 											wherers.push( filter.name + ' LIKE ?' );
// 											wherevals.push( '%' + filter.value + '%' );
// 										}
// 										break;
// 									}
// 									case 'bw': {
// 										if ( filter.isDescribed ) {
// 											wherers.push( '(' + filter.name + ' LIKE ? OR ' + filter.name + '_DESC LIKE ?)' );
// 											wherevals.push( filter.value + '%' );
// 											wherevals.push( filter.value + '%' );
// 										} else {
// 											wherers.push( filter.name + ' LIKE ?' );
// 											wherevals.push( filter.value + '%' );
// 										}
// 										break;
// 									}
// 									case 'ew': {
// 										if ( filter.isDescribed ) {
// 											wherers.push( '(' + filter.name + ' LIKE ? OR ' + filter.name + '_DESC LIKE ?)' );
// 											wherevals.push( '%' + filter.value );
// 											wherevals.push( '%' + filter.value );
// 										} else {
// 											wherers.push( filter.name + ' LIKE ?' );
// 											wherevals.push( '%' + filter.value );
// 										}
// 										break;
// 									}
// 								}
// 							}
// 						} );
// 					}
// 					if ( wherers.length > 0 ) {
// 						selectQuery += ' \nWHERE\n\t';
// 						selectQuery += wherers.join( '\n\tAND ' );
// 					}
// 					if ( payload.sorters ) {
// 						if ( payload.sorters.length > 0 ) {
// 							selectQuery += ' \nORDER BY';
// 							selectQuery += payload.sorters
// 								.map( sorter => ( '\n\t' + sorter.name + ' ' + ( sorter.isAsc ? 'ASC' : 'DESC' ) ) )
// 								.join( ', ' );
// 						}
// 					}
// 					this.db.query( selectQuery, wherevals, ( err, rows, resfields ) => {
// 						if ( err ) {
// 							reject( err );
// 						} else {
// 							matrix.matrixData = rows;
// 							resolve( matrix );
// 						}
// 					} );
// 				} ).catch( reject );
// 		} );
// 	}
// 	public matrixExport = ( payload: { id: number, requser: any, res: any } ) => {
// 		return new Promise( ( resolve, reject ) => {
// 			this.getMatrixTableAction( { id: payload.id, filters: [], sorters: [] } )
// 				.then( this.matrixExportGetStreamDetails )
// 				.then( this.matrixExportConvertToExcel )
// 				.then( ( workbook: excel.Workbook ) => {
// 					return this.matrixExportSendToUser( workbook, payload.requser, payload.res );
// 				} )
// 				.then( resolve )
// 				.catch( reject );
// 		} );
// 	}
// 	private matrixExportGetStreamDetails = ( matrix: DimeMatrix ): Promise<{ matrix, stream }> => {
// 		return new Promise( ( resolve, reject ) => {
// 			this.streamTool.getOne( matrix.stream )
// 				.then( stream => {
// 					resolve( { matrix, stream } );
// 				} ).catch( reject );
// 		} );
// 	}
// 	private matrixExportConvertToExcel = ( payload: { matrix: DimeMatrix, stream: DimeStreamDetail } ) => {
// 		return new Promise( ( resolve, reject ) => {

// 			const workbook = new excel.Workbook();
// 			workbook.creator = 'EPM ToolBox';
// 			workbook.lastModifiedBy = 'EPM ToolBox';
// 			workbook.created = new Date();
// 			workbook.modified = new Date();

// 			const sheet = workbook.addWorksheet( payload.matrix.name, { views: [{ state: 'frozen', xSplit: 1, ySplit: 1, activeCell: 'A1' }] } );
// 			if ( !payload.matrix.matrixData ) {
// 				sheet.addRow( ['There is no matrix data produced. If in doubt, please contact system admin!'] );
// 			} else if ( payload.matrix.matrixData.length === 0 ) {
// 				sheet.addRow( ['There is no matrix data produced. If in doubt, please contact system admin.'] );
// 			} else {
// 				const columns: excel.Column[] = [<excel.Column>{ header: 'id', key: 'id' }];
// 				const identifiers: any = { id: 1 };
// 				let column: string;
// 				let identifier: number;
// 				payload.stream.fieldList
// 					.filter( field => payload.matrix.fields[field.id] )
// 					.forEach( field => {
// 						column = field.name;
// 						identifier = 2;
// 						columns.push( <excel.Column>{ header: column, key: column } );
// 						identifiers[column] = identifier;
// 						if ( field.isDescribed ) {
// 							column = field.name + '_DESC';
// 							identifier = 0;
// 							columns.push( <excel.Column>{ header: column, key: column } );
// 							identifiers[column] = identifier;
// 						}
// 					} );
// 				sheet.columns = columns;
// 				sheet.addRow( identifiers );
// 				sheet.lastRow.hidden = true;
// 				sheet.addRows( payload.matrix.matrixData );
// 			}
// 			resolve( workbook );
// 		} );
// 	}
// 	private matrixExportSendToUser = ( refBook: excel.Workbook, refUser: any, response: any ) => {
// 		return new Promise( ( resolve, reject ) => {
// 			refBook.xlsx.write( response ).then( ( result: any ) => {
// 				response.end();
// 				resolve();
// 			} ).catch( reject );
// 		} );
// 	}
// 	public matrixImport = ( payload: { body: any, files: any[] } ) => {
// 		return new Promise( ( resolve, reject ) => {
// 			if ( !payload ) {
// 				reject( new Error( 'No data is provided' ) );
// 			} else if ( !payload.body ) {
// 				reject( new Error( 'No body is provided' ) );
// 			} else if ( !payload.body.id ) {
// 				reject( new Error( 'No matrix id is provided' ) );
// 			} else if ( !payload.files ) {
// 				reject( new Error( 'No files are uploaded' ) );
// 			} else if ( !Array.isArray( payload.files ) ) {
// 				reject( new Error( 'File list is not proper' ) );
// 			} else if ( payload.files.length !== 1 ) {
// 				reject( new Error( 'System is expecting exactly one file. Wrong number of files are received.' ) );
// 			} else {
// 				const workbook: any = new excel.Workbook();
// 				const buffer = new streamBuffers.ReadableStreamBuffer();
// 				buffer.put( payload.files[0].buffer );
// 				buffer.stop();
// 				let toInsert: any[];
// 				workbook.xlsx.read( buffer )
// 					.then( this.matrixImportGetExcelData )
// 					.then( ( tuples: any[] ) => {
// 						toInsert = tuples;
// 						return this.clearMatrixTable( payload.body.id );
// 					} )
// 					.then( () => {
// 						return this.populateMatrixTable( payload.body.id, toInsert );
// 					} )
// 					.then( result => {
// 						resolve( { result: 'OK' } );
// 					} )
// 					.catch( reject );
// 			}
// 		} );
// 	}
// 	private matrixImportGetExcelData = ( workbook: excel.Workbook ) => {
// 		return new Promise( ( resolve, reject ) => {
// 			const colHeaders: string[] = [];
// 			const colTypes: number[] = [];
// 			const tuples: any[] = [];
// 			let curTuple: any;
// 			let curIndex: number;
// 			if ( workbook.worksheets.length !== 1 ) {
// 				reject( new Error( 'System is expecting exactly one sheet in the workbook. Wrong number of sheets are received.' ) );
// 			} else if ( workbook.worksheets[0].rowCount < 3 ) {
// 				reject( new Error( 'System is expecting at least 3 rows in the excel sheet. Wrong number of rows are received.' ) );
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
// 					reject( new Error( 'No map data is found.' ) );
// 				} else {
// 					resolve( tuples );
// 				}
// 			}
// 		} );
// 	}
// 	private clearMatrixTable = ( id: number ) => {
// 		return new Promise( ( resolve, reject ) => {
// 			this.db.query( 'TRUNCATE MATRIX' + id + '_MATRIXTBL', ( err, result, fields ) => {
// 				if ( err ) {
// 					reject( err );
// 				} else {
// 					resolve();
// 				}
// 			} );
// 		} );
// 	}
// 	private populateMatrixTable = ( id: number, tuples: any[] ) => {
// 		return new Promise( ( resolve, reject ) => {
// 			const curKeys = Object.keys( tuples[0] );
// 			let curArray: any[];
// 			tuples.forEach( ( curResult, curItem ) => {
// 				curArray = [];
// 				curKeys.forEach( curKey => {
// 					curArray.push( curResult[curKey] );
// 				} );
// 				tuples[curItem] = curArray;
// 			} );
// 			this.db.query( 'INSERT INTO MATRIX' + id + '_MATRIXTBL (' + curKeys.join( ', ' ) + ') VALUES ?', [tuples], ( err, result, fields ) => {
// 				if ( err ) {
// 					reject( err );
// 				} else {
// 					resolve( id );
// 				}
// 			} );
// 		} );
// 	}
// }
