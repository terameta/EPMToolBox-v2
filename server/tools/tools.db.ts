import { Pool, createPool, FieldInfo } from 'mysql';
import { RealtimeDB } from './tools.rtdb';
import { MysqlConfig } from 'shared/models/systemconfig';
import { Subscription } from 'rxjs';

export class DB {
	public pool: Pool;
	public rtdb: RealtimeDB;
	private rtdbSub: Subscription;

	constructor( private dbConfig: MysqlConfig, serverid: number ) {
		this.initiate( dbConfig, serverid );
	}

	private initiate = ( dbConfig: MysqlConfig, serverid: number ) => {
		this.pool = null;
		if ( this.rtdbSub ) {
			this.rtdbSub.unsubscribe();
			this.rtdbSub = null;
		}
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
			this.rtdbSub = this.rtdb.errors$.subscribe( ( error ) => {
				console.log( '===========================================' );
				console.log( '===========================================' );
				console.log( 'We have caught RTDB error at tools.db.ts' );
				console.log( error );
				console.log( '===========================================' );
				console.log( '===========================================' );
				this.initiate( dbConfig, serverid );
			} );
		}

		this.pool.on( 'binlog', ( event ) => {
			console.log( 'Pool binlog@tools.db.ts', event.getEventName() );
		} );

		// this.pool.on( 'acquire', ( conn ) => {
		// 	// console.log( 'Connection acquired@tools.db.ts', conn.threadId );
		// } );

		// this.pool.on( 'release', ( conn ) => {
		// 	// console.log( 'Connection released@tools.db.ts', conn.threadId );
		// } );

		this.pool.on( 'error', ( error, a, b, c ) => {
			console.error( 'There is a db error@tools.db.ts' );
			console.error( error, a, b, c );
		} );

		if ( this.rtdb && process.env.isWorker === 'true' ) {
			setInterval( async () => {
				await this.queryOne( 'UPDATE dbchecker SET lastwrite = ?', ( new Date() ) );
				const { tuple } = await this.queryOne<any>( 'SELECT * FROM dbchecker' );
				const lastread = this.gfdt( new Date( tuple.lastread.toString() ) );
				const lastwrite = this.gfdt( new Date( tuple.lastwrite.toString() ) );
				console.log( 'Last Read:', lastread, 'Last Write:', lastwrite );
			}, 60000 );
		}

		if ( this.rtdb && process.env.isWorker === 'true' ) {
			this.rtdb.changes$.subscribe( async ( tableName: string ) => {
				console.log( 'Last Read (async):', this.gfdt( new Date() ) );
			} );
		}
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

	private gfdt = ( theDate?: Date ) => {
		const curDate = theDate || new Date();
		let toReturn: string; toReturn = '';
		toReturn += curDate.getFullYear();
		toReturn += '-';
		toReturn += ( '0' + ( curDate.getMonth() + 1 ).toString() ).substr( -2 );
		toReturn += '-';
		toReturn += ( '0' + curDate.getDate().toString() ).substr( -2 );
		toReturn += ' ';
		toReturn += ( '0' + curDate.getHours().toString() ).substr( -2 );
		toReturn += '-';
		toReturn += ( '0' + curDate.getMinutes().toString() ).substr( -2 );
		toReturn += '-';
		toReturn += ( '0' + curDate.getSeconds().toString() ).substr( -2 );
		return toReturn;
	}
}
