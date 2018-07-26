import * as cluster from 'cluster';
import { configuration } from './system.conf';
import { cpus } from 'os';
import { DB } from './tools/tools.db';
import { Initiator } from './config/config.initiator';
import { InitiateCronWorker } from './config/config.croner';
import { initiateApplicationWorker } from './config/config.app';

const numCPUs = configuration.numberofCPUs ? configuration.numberofCPUs : cpus().length;

const currentTimeStamp = Math.floor( Math.random() * Math.floor( 2 ** 32 - 1 ) );

const db: DB = new DB( configuration.mysql, currentTimeStamp );

if ( cluster.isMaster ) {
	let cronerpid: number;

	interface ApplicationEnvironmentProperties { isCroner: boolean, isWorker: boolean }
	const croner_env: ApplicationEnvironmentProperties = { isCroner: true, isWorker: false };
	const worker_env: ApplicationEnvironmentProperties = { isCroner: false, isWorker: true };

	const initiator = new Initiator( db, configuration );
	initiator.initiate().then( () => {
		console.log( '===============================================' );
		console.log( '=== Initiator is now complete               ===' );
		console.log( '===============================================' );
		console.log( '===============================================' );
		console.log( '=== Remember to fix croner                  ===' );
		console.log( '=== Remember to tools.main.signToken        ===' );
		console.log( '===============================================' );
		for ( let i = 0; i < numCPUs; i++ ) {
			cluster.fork( worker_env );
		}
		cronerpid = cluster.fork( croner_env ).process.pid;
	} ).catch( ( err ) => {
		console.log( '===============================================' );
		console.log( '=== There is an error with the initiator    ===' );
		console.log( '===============================================' );
		console.log( err );
		console.log( '===============================================' );
		process.exit();
	} );

	cluster.on( 'exit', ( worker, code, signal ) => {
		if ( worker.process.pid === cronerpid ) {
			console.log( 'Croner', worker.process.pid, 'died' );
			cronerpid = cluster.fork( croner_env ).process.pid;
		} else {
			console.log( 'Worker', worker.process.pid, 'died' );
			cluster.fork( worker_env );
		}
	} );
	cluster.on( 'online', ( worker ) => {
		if ( worker.process.pid === cronerpid ) {
			console.log( 'Croner ' + worker.process.pid + ' is online.' );
		} else {
			console.log( 'Worker ' + worker.process.pid + ' is online.' );
		}
	} );

} else /* this is not cluster master */ {
	process.env.NODE_ENV = 'production';
	if ( process.env.isCroner === 'true' ) {
		const cronWorker = new InitiateCronWorker( db, configuration );
	} else {
		initiateApplicationWorker( db, configuration );
	}
}

function exitHandler( options: any, err: any ) {
	if ( options.cleanup ) {
		console.log( 'cleaning' );
		db.pool.end( () => {
			console.log( 'All connections are closed' );
		} );
	}
	if ( err ) { console.log( err.stack ); }
	if ( options.exit ) { process.exit(); }
}

// do something when app is closing
process.on( 'exit', exitHandler.bind( null, { cleanup: true } ) );

// catches ctrl+c event
process.on( 'SIGINT', exitHandler.bind( null, { exit: true } ) );

// catches uncaught exceptions
process.on( 'uncaughtException', exitHandler.bind( null, { exit: true } ) );
