import { MysqlConfig } from '../../shared/models/systemconfig';
import * as ZongJi from 'zongji';
import { BehaviorSubject } from 'rxjs';

export class RealtimeDB {
	private includeSchemaAssigner = {};
	private backendDB;
	public changes$: BehaviorSubject<string>;

	constructor( private dbConfig: MysqlConfig, serverid: number ) {

		this.includeSchemaAssigner[dbConfig.db] = true;

		this.backendSetup( serverid );
		this.changes$ = new BehaviorSubject( '' );
	}

	private backendSetup = ( serverid: number ) => {

		this.backendDB = new ZongJi( {
			host: this.dbConfig.host,
			port: this.dbConfig.port,
			user: this.dbConfig.user,
			password: this.dbConfig.pass,
			database: this.dbConfig.db
		} );

		this.backendDB.on( 'binlog', ( event ) => {
			if ( event.getEventName() !== 'tablemap' ) {
				// console.log( '>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>' );
				// console.log( process.pid, 'isCroner:', process.env.isCroner, 'Event Name:', event.getEventName() );
				// console.log( process.pid, 'isCroner:', process.env.isCroner, 'Table ID:', event.tableId );
				// console.log( process.pid, 'isCroner:', process.env.isCroner, event.getEventName(), 'on', event.tableMap[event.tableId].tableName );
				this.changes$.next( event.tableMap[event.tableId].tableName );
			}
		} );

		this.backendDB.on( 'acquire', ( conn ) => {
			console.log( 'Connection acquired', conn.threadId );
		} );

		this.backendDB.on( 'release', ( conn ) => {
			console.log( 'Connection released', conn.threadId );
		} );

		this.backendDB.on( 'error', ( error, a, b, c ) => {
			console.error( 'There is a ZongJi error' );
			console.error( error );
			if ( error.fatal ) {
				this.backendDB.stop();
				this.backendDB.start( {
					includeEvents: ['tablemap', 'writerows', 'updaterows', 'deleterows'],
					startAtEnd: true,
					includeSchema: this.includeSchemaAssigner,
					serverId: serverid
				} );
			}
		} );

		this.backendDB.start( {
			includeEvents: ['tablemap', 'writerows', 'updaterows', 'deleterows'],
			startAtEnd: true,
			includeSchema: this.includeSchemaAssigner,
			serverId: serverid
		} );

		process.on( 'SIGINT', () => {
			console.log( 'Realtime DB received SIGINT' );
			this.backendDB.stop();
		} );

	}
}
