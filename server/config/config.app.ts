import * as express from 'express';
import * as http from 'http';
import * as path from 'path';
import * as bodyParser from 'body-parser';
import * as multer from 'multer';
import * as helmet from 'helmet';
import * as logger from 'morgan';
import * as jwt from 'express-jwt';

import { Pool } from 'mysql';

import { SystemConfig } from '../../shared/models/systemconfig';

import { Application } from 'express';
import { initializeRestApi } from '../api/api';
import { MainTools } from '../tools/tools.main';
import { DB } from '../tools/tools.db';

export function initiateApplicationWorker( refDB: DB, refConfig: SystemConfig ) {
	const app: Application = express();
	const mainTools = new MainTools( refDB.pool, refConfig );

	const multerStorage = multer.memoryStorage();

	app.use( bodyParser.json( { limit: '100mb' } ) );
	app.use( bodyParser.text( { limit: '100mb' } ) );
	app.use( bodyParser.urlencoded( { extended: true, limit: '100mb' } ) );
	app.use( multer( { storage: multerStorage } ).any() );
	app.use( express.static( path.join( __dirname, '../../dist' ) ) );

	app.enable( 'trust proxy' );

	app.use( helmet() );
	app.use( helmet.noCache() );

	app.use( logger( 'short' ) );

	app.use( '/api', jwt( { secret: refConfig.hash } ).unless( { path: ['/api/auth/signin', /\/api\/dime\/secret\/givemysecret/i] } ) );
	// app.use( '/api/dime', jwt( { secret: refConfig.hash } ) );
	// app.use( '/api/log', jwt( { secret: refConfig.hash } ) );

	initializeRestApi( app, refDB, mainTools );

	app.set( 'port', 8000 );

	app.get( '*', ( req, res ) => {
		res.sendFile( path.join( __dirname, '../../dist/index.html' ) );
	} );

	const server: http.Server = app.listen( app.get( 'port' ), () => {
		console.log( 'Server is now running on port ' + app.get( 'port' ) );
	} );

}
