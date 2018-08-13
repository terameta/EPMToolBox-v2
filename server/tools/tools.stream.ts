import { EnvironmentTool } from './tools.environment';
import { MainTools } from './tools.main';
import { DB } from './tools.db';
import { ATStream } from '../../shared/models/at.stream';
import { ATTuple } from '../../shared/models/at.tuple';

export class StreamTool {
	private environmentTool: EnvironmentTool;

	constructor( private db: DB, private tools: MainTools ) {
		this.environmentTool = new EnvironmentTool( db, tools );
	}

	public getAll = async (): Promise<ATStream[]> => {
		const { tuples } = await this.db.query<ATTuple>( 'SELECT * FROM streams' );
		return tuples.map( t => this.tools.prepareTupleToRead<ATStream>( t ) );
	}

	public getOne = async ( id: number ): Promise<ATStream> => {
		const { tuple } = await this.db.queryOne<ATTuple>( 'SELECT * FROM streams WHERE id = ?', id );
		return this.tools.prepareTupleToRead<ATStream>( tuple );
	}

	public create = async ( payload: ATStream ): Promise<ATStream> => {
		delete payload.id;
		const newStream = Object.assign( <ATStream>{ name: 'New Stream' }, payload );
		const { tuple } = await this.db.queryOne<any>( 'INSERT INTO streams SET ?', this.tools.prepareTupleToWrite( newStream ) );
		newStream.id = tuple.insertId;
		return newStream;
	}

	public update = async ( payload: ATStream ) => {
		await this.db.queryOne( 'UPDATE streams SET ? WHERE id = ?', [this.tools.prepareTupleToWrite( payload ), payload.id] );
	}

	public delete = async ( id: number ) => {
		await this.db.query( 'DELETE FROM streams WHERE id = ?', id );
	}

}

/*
import { DimeStreamField, DimeStreamFieldDetail } from '../../shared/model/dime/streamfield';
import { Pool } from 'mysql';
import * as excel from 'exceljs';
// const streamBuffers = require( 'stream-buffers' );
import * as streamBuffers from 'stream-buffers';
import { Duplex, PassThrough } from 'stream';

import { MainTools } from './tools.main';
import { DimeStream, DimeStreamDetail } from '../../shared/model/dime/stream';
import { EnvironmentTools } from './tools.dime.environment';
import { DimeEnvironmentDetail } from '../../shared/model/dime/environmentDetail';
import { DimeStreamType } from '../../shared/enums/dime/streamtypes';
import { SortByPosition, SortByName, arrayCartesian } from '../../shared/utilities/utilityFunctions';
import { findMembers } from '../../shared/utilities/hpUtilities';
import { MailTool } from './tools.mailer';
import { SettingsTool } from './tools.settings';
import * as _ from 'lodash';
import * as tmp from 'tmp';
import * as fs from 'fs';
import * as path from 'path';
import * as Promisers from '../../shared/utilities/promisers';
import * as Handlebars from 'handlebars';

export class StreamTools {
	environmentTool: EnvironmentTools;
	mailTool: MailTool;
	settingsTool: SettingsTool;

	constructor( public db: Pool, public tools: MainTools ) {
		this.environmentTool = new EnvironmentTools( this.db, this.tools );
		this.mailTool = new MailTool( this.db, this.tools );
		this.settingsTool = new SettingsTool( this.db, this.tools );
	}

	public fieldsListFromSourceEnvironment = ( id: number ) => {
		return new Promise( ( resolve, reject ) => {
			this.getOne( id ).
				then( this.buildQuery ).
				then( ( innerObj: DimeStream ) => {
					return this.environmentTool.listFields( <DimeEnvironmentDetail>{ id: innerObj.environment, query: innerObj.finalQuery, database: innerObj.dbName, table: innerObj.tableName } );
				} ).
				then( ( result: DimeStreamField[] ) => {
					result.forEach( ( curField, curKey ) => {
						if ( !curField.position ) { curField.position = curKey + 1; }
					} );
					resolve( result );
				} ).
				catch( reject );
		} );
	}
	public listFieldsforField = ( refObj: any ) => {
		return new Promise( ( resolve, reject ) => {
			const toBuild: any = {
				tableName: refObj.field.descriptiveTable,
				customQuery: refObj.field.descriptiveQuery
			};
			this.buildQuery( toBuild ).
				then( ( innerObj: any ) => {
					return this.environmentTool.listFields( <DimeEnvironmentDetail>{ id: refObj.environmentID, query: innerObj.finalQuery, database: refObj.field.descriptiveDB, table: refObj.field.descriptiveTable } );
				} ).
				then( ( result: any[] ) => {
					result.forEach( ( curField: any, curKey: any ) => {
						if ( !curField.position ) { curField.position = curKey + 1; }
					} );
					result.sort( SortByPosition );
					resolve( result );
				} ).
				catch( reject );
		} );
	}
	private buildQuery = ( refObj: any ) => {
		return new Promise( ( resolve, reject ) => {
			if ( refObj.tableName === 'Custom Query' ) {
				refObj.finalQuery = refObj.customQuery;
				if ( !refObj.finalQuery ) {
					reject( 'No query is defined or malformed query' );
				} else {
					if ( refObj.finalQuery.substr( refObj.finalQuery.length - 1 ) === ';' ) { refObj.finalQuery = refObj.finalQuery.slice( 0, -1 ); }
					resolve( refObj );
				}
			} else {
				refObj.finalQuery = 'SELECT * FROM ' + refObj.tableName;
				resolve( refObj );
			}
		} );
	}
	public assignFields = ( refObj: DimeStreamDetail ) => {
		return new Promise( ( resolve, reject ) => {
			if ( !refObj ) {
				reject( 'No data is provided' );
			} else if ( !refObj.id ) {
				reject( 'No stream id is provided' );
			} else if ( !refObj.fieldList ) {
				reject( 'No field list is provided' );
			} else if ( !Array.isArray( refObj.fieldList ) ) {
				reject( 'Field list is not valid' );
			} else {
				this.fieldsStartOver( refObj ).
					then( ( refStream: DimeStreamDetail ) => {
						let promises: any[]; promises = [];
						refStream.fieldList.forEach( ( curField: DimeStreamFieldDetail ) => {
							curField.stream = refStream.id;
							curField.name = curField.name;
							curField.type = curField.type;
							curField.position = curField.position;

							if ( curField.type === 'string' && curField.fCharacters === undefined ) { curField.fCharacters = 1024; }
							if ( curField.type === 'number' && curField.fPrecision === undefined ) { curField.fPrecision = 28; }
							if ( curField.type === 'number' && curField.fDecimals === undefined ) { curField.fDecimals = 8; }
							if ( curField.type === 'number' && curField.fDecimals < 0 ) { curField.fDecimals = 0; }
							if ( curField.type === 'number' && ( curField.fPrecision <= curField.fDecimals ) ) { curField.fDecimals = curField.fPrecision - 1; }
							if ( curField.type === 'date' && curField.fDateFormat === undefined ) { curField.fDateFormat = 'YYYY-MM-DD'; }
							if ( refStream.type === DimeStreamType.HPDB ) { curField.isDescribed = true; }
							delete curField.descriptiveTableList;
							delete curField.descriptiveFieldList;
							promises.push( this.assignField( curField ) );
						} );
						return Promise.all( promises );
					} ).
					then( ( result ) => {
						resolve( refObj );
					} ).
					catch( reject );
			}
		} );
	}
	private assignField = ( fieldDefinition: DimeStreamFieldDetail ) => {
		return new Promise( ( resolve, reject ) => {
			this.db.query( 'INSERT INTO streamfields SET ?', fieldDefinition, ( err, rows, fields ) => {
				if ( err ) {
					reject( err );
				} else {
					resolve();
				}
			} );
		} );
	}
	public fieldsStartOver = ( refObj: DimeStreamDetail ) => {
		return new Promise( ( resolve, reject ) => {
			this.db.query( 'DELETE FROM streamfields WHERE stream = ?', refObj.id, ( err, rows, fields ) => {
				if ( err ) {
					reject( err );
				} else {
					resolve( refObj );
				}
			} );
		} );
	}

	public retrieveField = ( id: number ) => {
		return new Promise( ( resolve, reject ) => {
			this.db.query( 'SELECT * FROM streamfields WHERE id = ?', id, ( err, rows, fields ) => {
				if ( err ) {
					reject( err );
				} else if ( rows.length !== 1 ) {
					reject( 'Field can not be found' );
				} else {
					resolve( rows[0] );
				}
			} );
		} );
	}
	// public saveFields = ( refObj: any ) => {
	// 	return new Promise( ( resolve, reject ) => {
	// 		if ( !refObj ) {
	// 			reject( 'No data is provided' );
	// 		} else if ( !refObj.id ) {
	// 			reject( 'No stream id is provided' );
	// 		} else if ( !refObj.fields ) {
	// 			reject( 'No field list is provided' );
	// 		} else if ( !Array.isArray( refObj.fields ) ) {
	// 			reject( 'Field list is not valid' );
	// 		} else {
	// 			let promises: any[]; promises = [];
	// 			refObj.fields.forEach( ( curField: any ) => {
	// 				promises.push( this.saveField( curField ) );
	// 			} );
	// 			Promise.all( promises ).
	// 				then( ( result ) => {
	// 					resolve( { result: 'OK' } );
	// 				} ).
	// 				catch( reject );
	// 		}
	// 	} );
	// }
	// private saveField = ( fieldDefinition: DimeStreamFieldDetail ) => {
	// 	return new Promise( ( resolve, reject ) => {
	// 		delete fieldDefinition.descriptiveTableList;
	// 		delete fieldDefinition.descriptiveFieldList;
	// 		this.db.query( 'UPDATE streamfields SET ? WHERE id = ' + fieldDefinition.id, fieldDefinition, ( err, rows, fields ) => {
	// 			if ( err ) {
	// 				reject( err );
	// 			} else {
	// 				resolve();
	// 			}
	// 		} )
	// 	} );
	// };
	public isReady = ( id: number ) => {
		return new Promise( ( resolve, reject ) => {
			this.checkTables( id ).
				then( ( tableList: any[] ) => {
					let toReturn = true;
					tableList.forEach( ( curTable ) => {
						if ( curTable.status === false ) { toReturn = false; }
					} );
					resolve( toReturn );
				} ).
				catch( reject );
		} );
	}
	private checkTables = ( id: number ) => {
		let topStream: any;
		let tablesReady: { tableName: string, stream: number, streamType: string, field: number, status: boolean }[]; tablesReady = [];
		return new Promise( ( resolve, reject ) => {
			this.getOne( id ).
				then( ( curStream: DimeStream ) => {
					topStream = curStream;
					topStream.typeName = DimeStreamType[topStream.type];
					return this.retrieveFields( id );
				} ).
				then( ( fields: DimeStreamFieldDetail[] ) => {
					if ( fields.length === 0 ) {
						reject( 'No fields are defined for stream' );
					} else {
						if ( topStream.type === DimeStreamType.HPDB ) {
							fields.forEach( ( curField ) => {
								curField.isDescribed = true;
							} );
						}
						const systemDBname = this.tools.config.mysql.db;
						const curQuery = 'SELECT * FROM information_schema.tables WHERE table_schema = ? AND table_name LIKE ?';
						this.db.query( curQuery, [systemDBname, 'STREAM' + id + '_%'], ( err, rows, rowfields ) => {
							if ( err ) {
								reject( err );
							} else {
								fields.forEach( ( curField ) => {
									if ( curField.isDescribed ) {
										const curTableName = 'STREAM' + topStream.id + '_DESCTBL' + curField.id;
										tablesReady.push( { tableName: curTableName, stream: id, streamType: topStream.typeName, field: curField.id, status: false } );
										rows.forEach( ( curTable: any ) => {
											if ( curTable.TABLE_NAME === curTableName ) {
												tablesReady.forEach( ( ct ) => {
													if ( ct.tableName === curTableName ) { ct.status = true; }
												} );
											}
										} );
									}
								} );
								resolve( tablesReady );
							}
						} );
					}
				} ).
				catch( reject );
		} );
	}
	public prepareTables = ( id: number ) => {
		return new Promise( ( resolve, reject ) => {
			this.checkTables( id ).
				then( ( tableList: { tableName: string, stream: number, streamType: string, field: number, status: boolean }[] ) => {
					let promises: any[]; promises = [];
					tableList.forEach( ( curTable ) => {
						promises.push( this.prepareTable( curTable ) );
					} );
					return Promise.all( promises );
				} ).
				then( ( result ) => {
					resolve( { preparedTables: result.length } );
				} ).
				catch( reject );
		} );
	}
	private prepareTable = ( tableStatus: { tableName: string, stream: number, streamType: string, field: number, status: boolean } ) => {
		return new Promise( ( resolve, reject ) => {
			if ( tableStatus.status ) {
				resolve( 'OK' );
			} else {
				this.retrieveField( tableStatus.field ).
					then( ( field: DimeStreamFieldDetail ) => {
						let curQuery: string; curQuery = '';
						curQuery += 'CREATE TABLE ' + tableStatus.tableName + ' (id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT';
						if ( tableStatus.streamType !== 'HPDB' ) { curQuery += ', RefField '; }
						if ( field.drfType === 'string' && tableStatus.streamType !== 'HPDB' ) { curQuery += 'VARCHAR(' + field.drfCharacters + ')'; }
						if ( field.drfType === 'number' && tableStatus.streamType !== 'HPDB' ) { curQuery += 'NUMERIC(' + field.drfPrecision + ',' + field.drfDecimals + ')'; }
						if ( field.drfType === 'date' && tableStatus.streamType !== 'HPDB' ) { curQuery += 'DATETIME'; }
						if ( tableStatus.streamType !== 'HPDB' ) { curQuery += ', Description '; }
						if ( field.ddfType === 'string' && tableStatus.streamType !== 'HPDB' ) { curQuery += 'VARCHAR(' + field.ddfCharacters + ')'; }
						if ( field.ddfType === 'number' && tableStatus.streamType !== 'HPDB' ) { curQuery += 'NUMERIC(' + field.ddfPrecision + ',' + field.ddfDecimals + ')'; }
						if ( field.ddfType === 'date' && tableStatus.streamType !== 'HPDB' ) { curQuery += 'DATETIME'; }
						if ( tableStatus.streamType === 'HPDB' ) {
							curQuery += ', RefField VARCHAR(256)';
							curQuery += ', Description VARCHAR(1024)';
						}
						curQuery += ', INDEX (RefField)';
						curQuery += ', PRIMARY KEY(id) );';
						this.db.query( curQuery, ( err, result, fields ) => {
							if ( err ) {
								reject( err );
							} else {
								resolve( 'OK' );
							}
						} );
					} ).
					catch( reject );
			}
		} );
	}
	public getFieldDescriptions = ( refObj: { stream: number, field: number } ) => {
		return new Promise( ( resolve, reject ) => {
			this.db.query( 'SELECT RefField, Description FROM STREAM' + refObj.stream + '_DESCTBL' + refObj.field + ' ORDER BY 1, 2', {}, ( err, result, fields ) => {
				if ( err ) {
					reject( err );
				} else {
					resolve( result );
				}
			} );
		} );
	}
	public getFieldDescriptionsWithHierarchy = ( payload: { stream: number, field: number } ) => {
		return new Promise( ( resolve, reject ) => {
			this.getOne( payload.stream ).then( ( stream ) => {
				stream.fieldList
					.filter( field => field.id === payload.field )
					.forEach( field => {
						this.environmentTool.getDescriptionsWithHierarchy( stream, field )
							.then( resolve ).catch( reject );
					} );
			} );
		} );
	}
	public getAllFieldDescriptionsWithHierarchy = async ( streamid: number ) => {
		const toReturn: any = {};
		const stream = await this.getOne( streamid );
		await Promise.all( stream.fieldList.map( async ( field ) => {
			toReturn[field.id] = await this.environmentTool.getDescriptionsWithHierarchy( stream, field );
		} ) );
		return toReturn;
	}
	public populateFieldDescriptions = ( id: number ) => {
		return this.getOne( id )
			.then( this.populateFieldDescriptionsClear )
			.then( this.populateFieldDescriptionsPullandSet );
	}
	private populateFieldDescriptionsClear = ( stream: DimeStreamDetail ): Promise<DimeStreamDetail> => {
		return new Promise( ( resolve, reject ) => {
			const promises = [];
			stream.fieldList
				.filter( currentField => currentField.isDescribed )
				.forEach( currentField => {
					promises.push( new Promise( ( subResolve, subReject ) => {
						this.db.query( 'TRUNCATE TABLE STREAM' + stream.id + '_DESCTBL' + currentField.id, ( err, result, fields ) => {
							if ( err ) {
								subReject( err );
							} else {
								subResolve( 'OK' );
							}
						} );
					} ) );
				} );
			Promise.all( promises ).then( () => {
				resolve( stream );
			} ).catch( reject );
		} );
	}
	private populateFieldDescriptionsPullandSet = ( stream: DimeStreamDetail ) => {
		return new Promise( ( resolve, reject ) => {
			const promises = [];
			stream.fieldList
				.filter( currentField => currentField.isDescribed )
				.forEach( currentField => {
					promises.push(
						this.environmentTool.getDescriptions( stream, currentField )
							.then( ( result: { RefField: string, Description: string }[] ) => this.populateFieldDescriptionsSet( result, stream, currentField ) )
					);
				} );
			Promise.all( promises ).then( () => {
				resolve( stream );
			} ).catch( reject );
		} );
	}
	private populateFieldDescriptionsSet = ( descriptions: { RefField: string, Description: string }[], stream: DimeStream, field: DimeStreamField ) => {
		return new Promise( ( resolve, reject ) => {
			if ( descriptions.length > 0 ) {
				const curKeys = Object.keys( descriptions[0] );
				let insertQuery: string; insertQuery = '';
				insertQuery += 'INSERT INTO STREAM' + stream.id + '_DESCTBL' + field.id + '(' + curKeys.join( ', ' ) + ') VALUES ?';
				let curArray: any[];
				const descriptionsToInsert: any[] = [];
				descriptions.forEach( ( curResult, curItem ) => {
					curArray = [];
					curKeys.forEach( ( curKey ) => {
						curArray.push( curResult[curKey] );
					} );
					descriptionsToInsert.push( curArray );
				} );
				this.db.query( insertQuery, [descriptionsToInsert], ( err, rows, fields ) => {
					if ( err ) {
						reject( err );
					} else {
						resolve( 'OK' );
					}
				} );
			} else {
				resolve( 'OK' );
			}
		} );
	}

	public executeExport = ( payload: { streamid: number, exportid: number, user: any, hierarchies?: any } ) => {
		this.executeExportAction( payload )
			.then( ( result: any ) => this.executeExportPrepareFile( { result, user: payload.user, hierarchies: result.query.hierarchies } ) )
			.then( this.executeExportSendFile )
			.catch( async ( issue ) => {
				const systemAdmin: any = await this.settingsTool.getOne( 'systemadmin' );
				const stream = await this.getOne( payload.streamid );
				const query = stream.exports.find( e => e.id === payload.exportid );
				const params = { fromname: systemAdmin.fromname, exportname: query.name, issue };
				let bodyXML = await Promisers.readFile( path.join( __dirname, './tools.email.templates/stream.export.failed.html' ) );
				let bodyTemplate = Handlebars.compile( bodyXML );
				let body = bodyTemplate( params );
				this.mailTool.sendMail( {
					from: systemAdmin.emailaddress,
					to: payload.user.email,
					cc: systemAdmin.emailaddress,
					subject: 'Export failed',
					html: body
				} ).catch( console.log );
				bodyXML = await Promisers.readFile( path.join( __dirname, './tools.email.templates/stream.export.failed.toAdmin.html' ) );
				bodyTemplate = Handlebars.compile( bodyXML );
				body = bodyTemplate( params );
				this.mailTool.sendMail( {
					from: systemAdmin.emailaddress,
					to: systemAdmin.emailaddress,
					subject: 'Export failed (Administrator Notification)',
					html: body
				} ).catch( console.log );
			} ).catch( console.log );
		return Promise.resolve( { status: 'Initiated' } );
	}
	private executeExportAction = async ( payload: { streamid: number, exportid: number, user: any } ) => {
		const stream = await this.getOne( payload.streamid );
		const query = stream.exports.find( e => e.id === payload.exportid );
		query.streamid = payload.streamid;
		query.dimensions = _.keyBy( stream.fieldList.map( f => ( <DimeStreamFieldDetail>{ id: f.id, stream: f.stream, name: f.name, type: f.type, position: f.position, descriptiveTable: f.descriptiveTable } ) ), 'id' );
		return this.environmentTool.readData( { id: stream.environment, db: stream.dbName, table: stream.tableName, query } );
	}

	private executeExportPrepareFile = async ( payload ) => {
		payload.workbookBuffer = new PassThrough();
		const workbook = new excel.stream.xlsx.WorkbookWriter( { stream: payload.workbookBuffer } );
		workbook.creator = 'EPM Toolbox';
		workbook.lastModifiedBy = 'EPM Toolbox';
		workbook.created = new Date();
		workbook.modified = new Date();

		const data = payload.result.data;
		const numRowDims = payload.result.query.rowDims.length;
		// const povsheet = workbook.addWorksheet( 'POVs', { views: [{ state: 'frozen', activeCell: 'A1' }] } );

		// let currentRow = 0;
		// let currentCol = 0;

		// povsheet.getCell( ++currentRow, ++currentCol ).value = 'POVs:';
		// payload.result.query.povMembers.forEach( pov => {
		// 	povsheet.getCell( currentRow, ++currentCol ).value = pov[0].RefField;
		// } );
		const povHeaders = payload.result.query.povDims.map( d => payload.result.query.dimensions[d].name ).map( h => ( { header: h, key: h } ) );
		povHeaders.splice( 0, 0, { header: 'POV Dimensions', key: 'POV Dimensions' } );
		const povValues = payload.result.query.povMembers.map( p => p[0].RefField );
		povValues.splice( 0, 0, 'POV Selections' );


		const sheet = workbook.addWorksheet( 'Data', { views: [{ state: 'frozen', xSplit: numRowDims * 2, ySplit: 4, activeCell: 'A1' }] } );

		// sheet.columns = povHeaders;
		await sheet.addRow( povHeaders.map( h => h.header ) ).commit();
		await sheet.addRow( povValues ).commit();
		await sheet.addRow( [] ).commit();
		// await sheet.commit();

		if ( data.length < 1 ) {
			sheet.addRow( ['There is no data produced with the data export. If in doubt, please contact system admin.'] );
		} else {
			const rowDims = payload.result.query.rowDims;
			const dimensions = payload.result.query.dimensions;
			const dataColumnHeaders = payload.result.query.colMembers.map( cm => cm.map( f => f.RefField ).join( '-' ) );
			const sheetColumns = [];
			rowDims.forEach( rd => {
				const columnDefiner = dimensions[rd].name;
				sheetColumns.push( { header: dimensions[rd].name, key: dimensions[rd].name } );
				sheetColumns.push( { header: dimensions[rd].name + ' Desc', key: dimensions[rd].name + ' Desc' } );
			} );
			dataColumnHeaders.forEach( dch => {
				sheetColumns.push( { header: dch, key: dch } );
			} );
			// sheet.columns = sheetColumns;
			await sheet.addRow( sheetColumns.map( c => c.header ) ).commit();

			while ( data.length > 0 ) {
				const rowToPush = [];
				const datum = data.splice( 0, 1 )[0];
				datum.headers.forEach( ( cell, dataIndex ) => {
					rowToPush.push( cell );
					rowToPush.push( payload.hierarchies[payload.result.query.rowDims[dataIndex]].find( e => e.RefField === cell ).Description || '' );
				} );
				let doWeHaveData = false;
				datum.data.forEach( cell => {
					if ( cell ) doWeHaveData = true;
					rowToPush.push( cell );
				} );
				if ( doWeHaveData ) await sheet.addRow( rowToPush ).commit();
			}
		}

		workbook.commit();

		return { ...payload, workbook };
	}
	private executeExportSendFile = async ( payload ) => {
		const systemAdmin: any = await this.settingsTool.getOne( 'systemadmin' );
		const params = { fromname: systemAdmin.fromname, exportname: payload.result.query.name };
		const bodyXML = await Promisers.readFile( path.join( __dirname, './tools.email.templates/stream.export.complete.html' ) );
		const bodyTemplate = Handlebars.compile( bodyXML );
		const body = bodyTemplate( params );
		const mailResult = await this.mailTool.sendMail( {
			from: systemAdmin.emailaddress,
			to: payload.user.email,
			cc: systemAdmin.emailaddress,
			subject: 'Requested Data File Attached',
			// text: 'Data file is attached.',
			html: body,
			attachments: [
				{
					filename: payload.result.query.name + '-' + this.tools.getFormattedDateTime() + '.xlsx',
					// content: workbookStream.getContents()
					// content: payload.workbookBuffer.getContents()
					content: payload.workbookBuffer
				}
			]
		} );
		return mailResult;
	}
	private workbookToStreamBuffer = ( workbook: excel.Workbook ) => {
		return new Promise( ( resolve, reject ) => {
			let myWritableStreamBuffer: any; myWritableStreamBuffer = new streamBuffers.WritableStreamBuffer();
			workbook.xlsx.write( myWritableStreamBuffer ).
				then( () => {
					resolve( myWritableStreamBuffer );
				} ).
				catch( reject );
		} );
	}
}

*/
