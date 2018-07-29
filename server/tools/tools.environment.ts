import { MainTools } from './tools.main';
import { DB } from './tools.db';
import { ATEnvironment, ATEnvironmentOnDB } from 'shared/models/at.environment';

export class EnvironmentTool {
	constructor( private db: DB, private tools: MainTools ) { }

	public getAll = async () => {
		const { tuples } = await this.db.query<ATEnvironmentOnDB>( 'SELECT * FROM environments' );
		return tuples.map( this.prepareTupleToRead );
	}

	private prepareTupleToRead = ( payload: ATEnvironmentOnDB ): ATEnvironment => Object.assign( <ATEnvironment>{}, payload, { tags: this.tools.jsonParseIf( payload.tags ) } );
	private prepareTupleToWrite = ( payload: ATEnvironment ): ATEnvironmentOnDB => Object.assign( <ATEnvironmentOnDB>{}, payload, { tags: this.tools.jsonStringifyIf( payload.tags ) } );
}
// import { DB } from './tools.db';

// import { MainTools } from './tools.main';
// import { ATEnvironment } from 'shared/models/at.environment';

// export class EnvironmentTool {
// 	sourceTools: any;
// 	// mssqlTool: MSSQLTools;
// 	// hpTool: HPTools;
// 	// pbcsTool: PBCSTools;
// 	credentialTool: CredentialTools;

// 	constructor( public db: DB, public tools: MainTools ) {
// 		this.sourceTools = {};
// 		this.sourceTools[DimeEnvironmentType.HP] = new HPTools( this.db, this.tools );
// 		this.sourceTools[DimeEnvironmentType.PBCS] = new PBCSTools( this.db, this.tools );
// 		this.sourceTools[DimeEnvironmentType.MSSQL] = new MSSQLTools( this.tools );

// 		this.credentialTool = new CredentialTools( this.db, this.tools );
// 	}


// 	public getOne = ( id: number ) => {
// 		return this.getEnvironmentDetails( <DimeEnvironmentDetail>{ id: id } );
// 	}

// 	public getEnvironmentDetails = ( refObj: DimeEnvironmentDetail, shouldShowPassword?: boolean ): Promise<DimeEnvironmentDetail | DimeEnvironmentDetailWithCredentials> => {
// 		return new Promise( ( resolve, reject ) => {
// 			this.db.query( 'SELECT * FROM environments WHERE id = ?', refObj.id, ( err, rows: DimeEnvironmentDetail[], fields ) => {
// 				if ( err ) {
// 					reject( err.code );
// 				} else if ( rows.length !== 1 ) {
// 					reject( 'Wrong number of records' );
// 				} else {
// 					if ( rows[0].tags ) {
// 						rows[0].tags = JSON.parse( rows[0].tags );
// 					} else {
// 						rows[0].tags = {};
// 					}
// 					if ( shouldShowPassword ) {
// 						this.credentialTool.getCredentialDetails( <DimeCredential>{ id: rows[0].credential }, true )
// 							.then( ( curCredential ) => {
// 								const environmentToReturn: DimeEnvironmentDetailWithCredentials = Object.assign( <DimeEnvironmentDetailWithCredentials>{}, rows[0] );
// 								environmentToReturn.username = curCredential.username;
// 								environmentToReturn.password = curCredential.password;
// 								resolve( environmentToReturn );
// 							} )
// 							.catch( reject );
// 					} else {
// 						resolve( rows[0] );
// 					}
// 				}
// 			} );
// 		} );
// 	}

// 	public create = () => {
// 		const newEnv = { name: 'New Environment', type: 0, server: '', port: '' };
// 		return new Promise( ( resolve, reject ) => {
// 			this.db.query( 'INSERT INTO environments SET ?', newEnv, function ( err, result, fields ) {
// 				if ( err ) {
// 					reject( { error: err, message: 'Failed to create a new environment.' } );
// 				} else {
// 					resolve( { id: result.insertId } );
// 				}
// 			} );
// 		} );
// 	}

// 	public update = ( refItem: DimeEnvironment ) => {
// 		return new Promise( ( resolve, reject ) => {
// 			refItem.tags = JSON.stringify( refItem.tags );
// 			this.db.query( 'UPDATE environments SET ? WHERE id = ?', [refItem, refItem.id], function ( err, result, fields ) {
// 				if ( err ) {
// 					reject( { error: err, message: 'Failed to update the environment' } );
// 				} else {
// 					resolve( refItem );
// 				}
// 			} );
// 		} );
// 	}

// 	public delete = ( id: number ) => {
// 		return new Promise( ( resolve, reject ) => {
// 			this.db.query( 'DELETE FROM environments WHERE id = ?', id, ( err, result, fields ) => {
// 				if ( err ) {
// 					reject( { error: err, message: 'Failed to delete the environment' } );
// 				} else {
// 					resolve( { id: id } );
// 				}
// 			} );
// 		} );
// 	}

// 	public verify = ( envID: number ) => {
// 		let environmentObject: DimeEnvironmentDetail;
// 		return new Promise( ( resolve, reject ) => {
// 			environmentObject = <DimeEnvironmentDetail>{ id: envID };
// 			this.getEnvironmentDetails( environmentObject, true ).
// 				// then( this.getTypeDetails ).
// 				then( ( curObj ) => this.sourceTools[curObj.type].verify( curObj ) ).
// 				then( this.setVerified ).
// 				then( ( result ) => {
// 					resolve( { id: envID, result: 'OK' } );
// 				} ).catch( ( issue ) => {
// 					reject( issue );
// 				} );
// 		} );
// 	}

// 	private setVerified = ( refObj: DimeEnvironment ) => {
// 		return new Promise( ( resolve, reject ) => {
// 			this.db.query( 'UPDATE environments SET ? WHERE id = ' + refObj.id, { verified: 1 }, ( err, results, fields ) => {
// 				if ( err ) {
// 					reject( err );
// 				} else {
// 					refObj.verified = 1;
// 					resolve( refObj );
// 				}
// 			} );
// 		} );
// 	}

// 	public listDatabases = ( refObj: DimeEnvironmentDetail ) => {
// 		// console.log('Environment list databases');
// 		return new Promise( ( resolve, reject ) => {
// 			this.getEnvironmentDetails( refObj, true ).
// 				// then( this.getTypeDetails ).
// 				then( ( curObj ) => this.sourceTools[curObj.type].listDatabases( curObj ) ).
// 				then( resolve ).
// 				catch( ( issue ) => {
// 					reject( { error: issue, message: 'Failed to list the databases' } );
// 				} );
// 		} );
// 	}
// 	public listTables = ( refObj: DimeEnvironmentDetail ) => {
// 		return new Promise( ( resolve, reject ) => {
// 			this.getEnvironmentDetails( refObj, true )
// 				.then( ( curObj ) => {
// 					curObj.database = refObj.database;
// 					return this.sourceTools[curObj.type].listTables( curObj );
// 				} )
// 				.then( resolve )
// 				.catch( reject );
// 		} );
// 	}
// 	public listDescriptiveTables = ( refObj: DimeEnvironmentDetail ) => {
// 		return new Promise( ( resolve, reject ) => {
// 			this.getEnvironmentDetails( refObj, true )
// 				.then( ( curObj ) => {
// 					curObj.database = refObj.database;
// 					switch ( curObj.type ) {
// 						case DimeEnvironmentType.HP:
// 						case DimeEnvironmentType.PBCS:
// 							curObj.table = refObj.table;
// 							return this.sourceTools[curObj.type].listAliasTables( curObj );
// 						default:
// 							return this.sourceTools[curObj.type].listTables( curObj );
// 					}
// 				} )
// 				.then( resolve )
// 				.catch( reject );
// 		} );
// 	}
// 	public listFields = ( refObj: DimeEnvironmentDetail ) => {
// 		return new Promise( ( resolve, reject ) => {
// 			this.getEnvironmentDetails( refObj, true ).
// 				then( ( innerObj ) => {
// 					innerObj.database = refObj.database;
// 					innerObj.query = refObj.query;
// 					innerObj.table = refObj.table;
// 					return this.sourceTools[innerObj.type].listFields( innerObj );
// 				} ).
// 				then( resolve ).
// 				catch( reject );
// 		} );
// 	}
// 	public listAliasTables = ( refObj: DimeEnvironmentDetail ) => {
// 		return new Promise( ( resolve, reject ) => {
// 			this.getEnvironmentDetails( refObj, true )
// 				.then( ( innerObj ) => {
// 					innerObj.database = refObj.database;
// 					innerObj.query = refObj.query;
// 					innerObj.table = refObj.table;
// 					return this.sourceTools[innerObj.type].listAliasTables( innerObj );
// 				} )
// 				.then( resolve )
// 				.catch( reject );
// 		} );
// 	}
// 	public listProcedures = ( curStream: DimeStream ) => {
// 		return new Promise( ( resolve, reject ) => {
// 			this.getEnvironmentDetails( <DimeEnvironmentDetail>{ id: curStream.environment }, true ).
// 				then( ( innerObj ) => {
// 					if ( curStream.dbName ) { innerObj.database = curStream.dbName; }
// 					if ( curStream.tableName ) { innerObj.table = curStream.tableName; }
// 					return this.sourceTools[innerObj.type].listProcedures( innerObj );
// 				} ).
// 				then( resolve ).
// 				catch( reject );
// 		} );
// 	}

// 	public listProcedureDetails = ( refObj: { stream: DimeStream, procedure: any } ) => {
// 		return new Promise( ( resolve, reject ) => {
// 			this.getEnvironmentDetails( <DimeEnvironmentDetail>{ id: refObj.stream.environment }, true ).
// 				then( ( innerObj: any ) => {
// 					innerObj.database = refObj.stream.dbName;
// 					innerObj.table = refObj.stream.tableName;
// 					innerObj.procedure = refObj.procedure;
// 					return this.sourceTools[innerObj.type].listProcedureDetails( innerObj );
// 				} ).
// 				then( resolve ).
// 				catch( reject );
// 		} );
// 	}
// 	public runProcedure = ( refObj: { stream: DimeStream, procedure: any } ) => {
// 		return new Promise( ( resolve, reject ) => {
// 			if ( !refObj ) {
// 				reject( 'No object passed.' );
// 			} else if ( !refObj.stream ) {
// 				reject( 'No stream passed.' );
// 			} else if ( !refObj.stream.environment ) {
// 				reject( 'Malformed stream object' );
// 			} else if ( !refObj.procedure ) {
// 				reject( 'Procedure definition is missing' );
// 			} else {
// 				this.getEnvironmentDetails( <DimeEnvironmentDetail>{ id: refObj.stream.environment }, true ).
// 					// then( this.getTypeDetails ).
// 					then( ( innerObj: any ) => {
// 						innerObj.database = refObj.stream.dbName;
// 						innerObj.table = refObj.stream.tableName;
// 						innerObj.procedure = refObj.procedure;
// 						if ( refObj.procedure ) {
// 							if ( refObj.procedure.tableName ) innerObj.table = refObj.procedure.tableName;
// 						}
// 						return this.sourceTools[innerObj.type].runProcedure( innerObj );
// 					} ).
// 					then( resolve ).
// 					catch( reject );
// 			}
// 		} );
// 	}
// 	public getDescriptions = ( refStream: DimeStream, refField: DimeStreamField ) => {
// 		return new Promise( ( resolve, reject ) => {
// 			if ( !refStream.environment ) {
// 				reject( 'Malformed stream object' );
// 			} else {
// 				this.getEnvironmentDetails( <DimeEnvironmentDetail>{ id: refStream.environment }, true ).
// 					// then( this.getTypeDetails ).
// 					then( ( innerObj: any ) => {
// 						innerObj.database = refStream.dbName;
// 						innerObj.table = refStream.tableName;
// 						innerObj.field = refField;
// 						return this.sourceTools[innerObj.type].getDescriptions( innerObj, refField );
// 					} ).
// 					then( resolve ).
// 					catch( reject );
// 			}
// 		} );
// 	}
// 	public getDescriptionsWithHierarchy = ( refStream: DimeStream, refField: DimeStreamField ) => {
// 		return new Promise( ( resolve, reject ) => {
// 			if ( !refStream.environment ) {
// 				reject( new Error( 'Malformed stream object' ) );
// 			} else {
// 				this.getEnvironmentDetails( <DimeEnvironmentDetail>{ id: refStream.environment }, true )
// 					.then( ( result: any ) => {
// 						result.database = refStream.dbName;
// 						result.table = refStream.tableName;
// 						result.field = refField;
// 						return this.sourceTools[result.type].getDescriptionsWithHierarchy( result, refField );
// 					} ).then( resolve ).catch( reject );
// 			}
// 		} );
// 	}
// 	public writeData = ( refObj: any ) => {
// 		return new Promise( ( resolve, reject ) => {
// 			this.getEnvironmentDetails( <DimeEnvironmentDetail>{ id: refObj.id }, true ).
// 				// then( this.getTypeDetails ).
// 				then( ( innerObj: any ) => {
// 					innerObj.database = refObj.db;
// 					innerObj.table = refObj.table;
// 					innerObj.data = refObj.data;
// 					innerObj.sparseDims = refObj.sparseDims;
// 					innerObj.denseDim = refObj.denseDim;
// 					return this.sourceTools[innerObj.type].writeData( innerObj );
// 				} ).
// 				then( resolve ).
// 				catch( reject );
// 		} );
// 	}
// 	public readData = ( refObj: any ) => {
// 		return new Promise( ( resolve, reject ) => {
// 			this.getEnvironmentDetails( <DimeEnvironmentDetail>{ id: refObj.id }, true )
// 				.then( ( innerObj: any ) => {
// 					innerObj.database = refObj.db;
// 					innerObj.table = refObj.table;
// 					innerObj.query = refObj.query;
// 					return this.sourceTools[innerObj.type].readData( innerObj );
// 				} )
// 				.then( resolve ).catch( reject );
// 		} );
// 	}
// }
