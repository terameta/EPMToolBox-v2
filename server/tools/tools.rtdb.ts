import { MysqlConfig } from 'shared/models/systemconfig';
import * as ZongJi from 'zongji';

export class RealtimeDB {
	private includeSchemaAssigner = {};
	private backendDB;

	constructor( private dbConfig: MysqlConfig, serverid: number ) {

		this.includeSchemaAssigner[dbConfig.db] = true;

		this.backendSetup( serverid );
	}

	private backendSetup = ( serverid: number ) => {
		console.log( 'Backend setup is starting' );

		this.backendDB = new ZongJi( {
			host: this.dbConfig.host,
			port: this.dbConfig.port,
			user: this.dbConfig.user,
			password: this.dbConfig.pass,
			database: this.dbConfig.db
		} );

		this.backendDB.on( 'binlog', ( event ) => {
			console.log( event.getEventName() );
			console.log( event.tableId );
			console.log( event.tableMap[event.tableId].tableName );
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
