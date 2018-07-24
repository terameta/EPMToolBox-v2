import { DB } from '../tools/tools.db';
import { SystemConfig } from 'shared/models/systemconfig';
import { MainTools } from '../tools/tools.main';


import * as express from 'express';
import * as http from 'http';
import * as socketio from 'socket.io';
import * as multer from 'multer';
import * as bodyParser from 'body-parser';
import { join } from 'path';
import * as helmet from 'helmet';
import * as logger from 'morgan';
import { ATApi } from '../api/api';

export function initiateApplicationWorker( refDB: DB, refConfig: SystemConfig ) {
	const app: express.Application = express();
	const server: http.Server = new http.Server( app );
	const io: socketio.Server = socketio( server );

	const mainTools = new MainTools( refDB.pool, refConfig );
	const api: ATApi = new ATApi( refDB, mainTools );

	const multerStorage = multer.memoryStorage();

	app.use( bodyParser.json( { limit: '100mb' } ) );
	app.use( bodyParser.text( { limit: '100mb' } ) );
	app.use( bodyParser.urlencoded( { extended: true, limit: '100mb' } ) );
	app.use( multer( { storage: multerStorage } ).any() );
	app.use( express.static( join( __dirname, '../../dist' ) ) );

	app.enable( 'trust proxy' );
	app.use( helmet() );
	app.use( helmet.noCache() );

	app.use( logger( 'short' ) );

	app.get( '*', ( req, res ) => {
		res.sendFile( join( __dirname, '../../dist/index.html' ) );
	} );


	io.on( 'connection', ( socket ) => {
		console.log( 'a user connected' );
		console.log( socket.client.id );
		// console.log( socket );
		socket.on( 'disconnect', () => {
			console.log( 'user disconnected' );
		} );
		socket.on( 'communication', ( payload ) => {
			api.respond( payload, socket );
		} );
	} );

	server.listen( refConfig.serverPort, () => {
		console.log( 'Server is now running on port ' + refConfig.serverPort );
	} );


}

// import * as express from 'express';
// import * as http from 'http';
// import * as path from 'path';
// import * as bodyParser from 'body-parser';
// import * as multer from 'multer';
// import * as helmet from 'helmet';
// import * as logger from 'morgan';
// import * as jwt from 'express-jwt';
// import * as socketio from 'socket.io';

// import { Application } from 'express';
// import { initializeRestApi } from '../api/api';
// import { MainTools } from '../tools/tools.main';
// import { DB } from '../tools/tools.db';

// export function initiateApplicationWorker( refDB: DB, refConfig: SystemConfig ) {
// 	const app: Application = express();
// 	const mainTools = new MainTools( refDB.pool, refConfig );

// 	const multerStorage = multer.memoryStorage();

// 	app.use( bodyParser.json( { limit: '100mb' } ) );
// 	app.use( bodyParser.text( { limit: '100mb' } ) );
// 	app.use( bodyParser.urlencoded( { extended: true, limit: '100mb' } ) );
// 	app.use( multer( { storage: multerStorage } ).any() );
// 	app.use( express.static( path.join( __dirname, '../../dist' ) ) );

// 	app.enable( 'trust proxy' );

// 	app.use( helmet() );
// 	app.use( helmet.noCache() );

// 	app.use( logger( 'short' ) );

// 	app.use( '/api', jwt( { secret: refConfig.hash } ).unless( { path: ['/api/auth/signin', /\/api\/dime\/secret\/givemysecret/i] } ) );
// 	// app.use( '/api/dime', jwt( { secret: refConfig.hash } ) );
// 	// app.use( '/api/log', jwt( { secret: refConfig.hash } ) );

// 	initializeRestApi( app, refDB, mainTools );

// 	app.set( 'port', 8000 );

// 	app.get( '*', ( req, res ) => {
// 		res.sendFile( path.join( __dirname, '../../dist/index.html' ) );
// 	} );

// 	const server: http.Server = app.listen( app.get( 'port' ), () => {
// 		console.log( 'Server is now running on port ' + app.get( 'port' ) );
// 	} );

// 	const io: socketio.Server = socketio( server );
// 	io.on( 'connection', ( socket ) => {
// 		console.log( socket );
// 		console.log( 'a user connected' );
// 	} );

// }
