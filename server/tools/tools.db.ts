import { Pool, createPool, FieldInfo } from 'mysql';
import { RealtimeDB } from './tools.rtdb';
import { MysqlConfig } from 'shared/models/systemconfig';

export class DB {
	public pool: Pool;
	public rtdb: RealtimeDB;

	constructor( private dbConfig: MysqlConfig, serverid: number ) {
		console.log( 'Relational database pool initializing @ tools.db.ts' );
		this.pool = createPool( {
			connectionLimit: 10,
			queueLimit: 0,
			host: dbConfig.host,
			port: dbConfig.port,
			user: dbConfig.user,
			password: dbConfig.pass,
			database: dbConfig.db
		} );
		console.log( 'Relational database pool created @ tools.db.ts' );
		console.log( 'Realtime database connection initializing @ tools.db.ts' );
		this.rtdb = new RealtimeDB( dbConfig, serverid );
		console.log( 'Realtime database connection initialization completed @ tools.db.ts' );

	}

	public query = <T>( queryToExecute: string, queryArguments?: any ): Promise<{ result: T, fields: FieldInfo[] }> => {
		return new Promise( ( resolve, reject ) => {
			if ( queryArguments !== undefined ) {
				this.pool.query( queryToExecute, queryArguments, ( err, result: T, fields ) => {
					if ( err ) {
						reject( err );
					} else {
						resolve( { result, fields } );
					}
				} );
			} else {
				this.pool.query( queryToExecute, ( err, result: T, fields ) => {
					if ( err ) {
						reject( err );
					} else {
						resolve( { result, fields } );
					}
				} );
			}
		} );
	}
}
