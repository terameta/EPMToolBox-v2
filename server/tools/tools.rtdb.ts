import { MysqlConfig } from '../../shared/models/systemconfig';
import * as ZongJi from 'zongji';
import { Subject } from 'rxjs';

export class RealtimeDB {
	private includeSchemaAssigner = {};
	private backendDB;
	public changes$: Subject<string>;

	constructor( private dbConfig: MysqlConfig, serverid: number ) {

		this.includeSchemaAssigner[dbConfig.db] = true;

		this.backendSetup( serverid );
		this.changes$ = new Subject();
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
				console.log( '>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>' );
				console.log( process.pid, 'isCroner:', process.env.isCroner, 'Event Name:', event.getEventName() );
				console.log( process.pid, 'isCroner:', process.env.isCroner, 'Table ID:', event.tableId );
				console.log( process.pid, 'isCroner:', process.env.isCroner, 'Table Name:', event.tableMap[event.tableId].tableName );
				this.changes$.next( event.tableMap[event.tableId].tableName );
			}
		} );

		this.backendDB.on( 'error', ( error, a, b, c ) => {
			console.error( 'There is a ZongJi error' );
			console.error( error );
			console.error( a, b, c );
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
