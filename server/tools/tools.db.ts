import { Pool, createPool, FieldInfo } from 'mysql';
import { RealtimeDB } from './tools.rtdb';
import { MysqlConfig } from 'shared/models/systemconfig';

export class DB {
	public pool: Pool;
	public rtdb: RealtimeDB;

	constructor( private dbConfig: MysqlConfig, serverid: number ) {
		this.pool = createPool( {
			connectionLimit: 10,
			queueLimit: 0,
			host: dbConfig.host,
			port: dbConfig.port,
			user: dbConfig.user,
			password: dbConfig.pass,
			database: dbConfig.db
		} );
		if ( process.env.isWorker === 'true' ) {
			this.rtdb = new RealtimeDB( dbConfig, serverid );
		}

		this.pool.on( 'binlog', ( event ) => {
			console.log( 'Pool binlog@tools.db.ts', event.getEventName() );
		} );

		this.pool.on( 'acquire', ( conn ) => {
			console.log( 'Connection acquired@tools.db.ts', conn.threadId );
		} );

		this.pool.on( 'release', ( conn ) => {
			console.log( 'Connection released@tools.db.ts', conn.threadId );
		} );

		this.pool.on( 'error', ( error, a, b, c ) => {
			console.error( 'There is a db error@tools.db.ts' );
			console.error( error, a, b, c );
		} );
	}

	public query = <T>( queryToExecute: string, queryArguments?: any ): Promise<{ tuples: T[], fields: FieldInfo[] }> => {
		return new Promise( ( resolve, reject ) => {
			if ( queryArguments !== undefined ) {
				this.pool.query( queryToExecute, queryArguments, ( err, tuples: T[], fields ) => {
					if ( err ) {
						reject( err );
					} else {
						resolve( { tuples, fields } );
					}
				} );
			} else {
				this.pool.query( queryToExecute, ( err, tuples: T[], fields ) => {
					if ( err ) {
						reject( err );
					} else {
						resolve( { tuples, fields } );
					}
				} );
			}
		} );
	}
	public queryOne = async <T>( queryToExecute: string, queryArguments?: any ): Promise<{ tuple: T, fields: FieldInfo[] }> => {
		const { tuples, fields } = await this.query<T>( queryToExecute, queryArguments );
		if ( tuples.length !== 1 && Array.isArray( tuples ) ) throw new Error( 'Wrong number of records. 1 expected' );
		return { tuple: Array.isArray( tuples ) ? tuples[0] : tuples, fields };
	}
}
