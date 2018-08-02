import * as express from 'express';
import { Server } from 'http';
import * as socketio from 'socket.io';
import * as multer from 'multer';
import * as bodyParser from 'body-parser';
import { join } from 'path';
import * as helmet from 'helmet';
import * as logger from 'morgan';
import { Subscription } from 'rxjs';

import { DB } from '../tools/tools.db';
import { SystemConfig } from '../../shared/models/systemconfig';
import { MainTools } from '../tools/tools.main';
import { ATApi } from '../api/api';
import { ATDataStoreInterest } from '../../shared/models/at.datastoreinterest';
import { ATApiCommunication } from '../../shared/models/at.socketrequest';

export class ApplicationWorker {
	private app: express.Application;
	private server: Server;
	private io: socketio.Server;

	private mainTools: MainTools;
	private api: ATApi;
	private multerStorage: multer.StorageEngine;

	constructor( private db: DB, config: SystemConfig ) {
		this.app = express();
		this.server = new Server( this.app );
		this.io = socketio( this.server );

		this.mainTools = new MainTools( db.pool, config );
		this.api = new ATApi( db, this.mainTools );

		this.multerStorage = multer.memoryStorage();

		this.app.use( bodyParser.json( { limit: '100mb' } ) );
		this.app.use( bodyParser.text( { limit: '100mb' } ) );
		this.app.use( bodyParser.urlencoded( { extended: true, limit: '100mb' } ) );
		this.app.use( multer( { storage: this.multerStorage } ).any() );
		this.app.use( express.static( join( __dirname, '../../dist' ) ) );

		this.app.enable( 'trust proxy' );
		this.app.use( helmet() );
		this.app.use( helmet.noCache() );

		this.app.use( logger( 'short' ) );

		this.app.get( '*', ( req, res ) => {
			res.sendFile( join( __dirname, '../../dist/index.html' ) );
		} );

		this.server.listen( config.serverPort, () => {
			console.log( 'Server is now running on port ' + config.serverPort );
		} );

		this.io.on( 'connection', this.handleConnection );

		// setInterval( () => {
		// 	console.log( 'Inserting into the streams table' );
		// 	this.db.query( 'INSERT INTO streams (name, type, environment, dbName, tableName, customQuery, tags, exports) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', ['deleteMe', 0, 0, 'dbName', 'tableName', 'customQuery', '', ''] );
		// }, 30000 );

		// setTimeout( () => {
		// 	setInterval( () => {
		// 		console.log( 'Updating in the streams table' );
		// 		this.db.query( 'UPDATE streams SET dbName = ? WHERE name = ?', ['theDBName', 'deleteMe'] );
		// 	}, 30000 );
		// }, 10000 );

		// setTimeout( () => {
		// 	setInterval( () => {
		// 		console.log( 'Deleting from the streams table' );
		// 		this.db.query( 'DELETE FROM streams WHERE name = ?', 'deleteMe' );
		// 	}, 30000 );
		// }, 20000 );

	}

	private handleConnection = ( socket: socketio.Socket ) => {
		// console.log( 'a user connected' );
		// console.log( socket.client.id );
		const interests: ATDataStoreInterest[] = [];
		const changeSubscription: Subscription = this.db.rtdb.changes$.subscribe( ( changedTable: string ) => { this.handleChanges( changedTable, interests, socket ); } );
		// console.log( 'We have now subscribed to changes$ on rtdb' );
		// console.log( socket );
		socket.on( 'disconnect', () => {
			// console.log( 'user disconnected' );
			changeSubscription.unsubscribe();
		} );
		socket.on( 'communication', ( payload: ATApiCommunication ) => {
			this.api.respond( payload, socket ).catch( console.log );
		} );
		socket.on( 'interest', ( payload ) => {
			this.handleInterests( interests, payload, socket );
		} );
	}

	private handleInterests = async ( interests: ATDataStoreInterest[], newInterests: ATDataStoreInterest[], socket: socketio.Socket ) => {
		// console.log( 'Existing Interests', interests );
		// console.log( 'New Interests', newInterests );
		newInterests.forEach( interest => {
			const toCompare = this.interestToString( interest );
			if ( !interests.map( e => JSON.stringify( e ) ).includes( toCompare ) ) {
				interests.push( interest );
				this.handleChanges( interest.concept, interests, socket );
			}
		} );
		interests = interests.filter( interest => {
			const toCompare = this.interestToString( interest );
			if ( !newInterests.map( this.interestToString ).includes( toCompare ) ) {
				return false;
			} else {
				return true;
			}
		} );
	}

	private handleChanges = async ( changedTable: string, interests: ATDataStoreInterest[], socket: socketio.Socket ) => {
		// console.log( 'We are at handleChanges for table', changedTable );
		if ( interests.filter( i => i.concept === changedTable ).length > 0 ) {
			const payload: ATApiCommunication = {
				framework: changedTable,
				action: 'getAll',
				payload: {
					status: 'request',
					data: null
				}
			};
			this.api.respond( payload, socket );
			// console.log( 'We are at handleChanges for table', changedTable, 'is in the interests' );
			// this.api.respond()

			// throw new Error( 'This is not correct way, pull data from the tools.xxframeworkxxx.ts' );
			// const { tuples } = await this.db.query<any>( 'SELECT * FROM ' + changedTable );
			// const packet: ATApiCommunication = <ATApiCommunication>{};
			// packet.framework = changedTable;
			// packet.action = 'refresh';
			// packet.payload = {
			// 	status: 'success',
			// 	data: tuples
			// };
			// // console.log( 'We are at handleChanges', changedTable, '#Tuples:', tuples.length );
			// socket.emit( 'communication', packet );
		}
	}

	private interestToString = ( interest: ATDataStoreInterest ) => {
		return JSON.stringify( { concept: interest.concept, id: interest.id || interest.id === 0 ? interest.id : undefined } );
	}
}
