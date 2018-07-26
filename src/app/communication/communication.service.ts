import { Injectable } from '@angular/core';
import * as socketio from 'socket.io-client';
import { PlatformLocation } from '@angular/common';
import { configuration } from '../../../server/system.conf';
import { AuthService } from '../auth/auth.service';
import { DataStoreService } from '../data-store/data-store.service';
import { withLatestFrom, map, filter } from 'rxjs/operators';
import { BehaviorSubject, Subscription } from '../../../node_modules/rxjs';
import { ATUser } from 'shared/models/at.user';
import { ATApiCommunication } from 'shared/models/at.socketrequest';
import { CentralStatusService } from '../central-status.service';
import { ATDataStoreInterest } from '../../../shared/models/at.datastoreinterest';

@Injectable( {
	providedIn: 'root'
} )
export class CommunicationService {
	public baseURL = '';
	public socket;
	public isConnected$ = new BehaviorSubject<boolean>( false );
	private interestSubscription: Subscription;

	constructor(
		platformLocation: PlatformLocation,
		private as: AuthService,
		private ds: DataStoreService,
		private cs: CentralStatusService
	) {
		const protocol = ( platformLocation as any ).location.protocol;
		const hostname = ( platformLocation as any ).location.hostname;
		this.baseURL = protocol + '//' + hostname + ':' + configuration.serverPort;
		this.socket = socketio( this.baseURL );
		// console.log( 'Communication service is initiated on URL:', this.baseURL );

		this.socket.on( 'connect', () => {
			// console.log( 'Client side socket is connected', this.socket.id );
			this.isConnected$.next( true );
			this.interestSubscription = this.ds.interests$.subscribe( this.showInterest );
		} );
		this.socket.on( 'disconnect', () => {
			// console.log( 'Client side socket is disconnected', this.socket.id );
			if ( this.interestSubscription ) {
				this.interestSubscription.unsubscribe();
				this.interestSubscription = null;
			}
			this.isConnected$.next( false );
		} );
		this.socket.on( 'communication', ( response: ATApiCommunication ) => {
			// this.displayResponseDetails( response );
			if ( response.payload.status === 'success' ) {
				if ( response.framework === 'auth' ) {
					this.as[response.action]( response.payload );
				} else {
					// this.ds.react( response );
				}
			} else if ( response.payload.status === 'error' ) {
				console.log( 'Here we should handle with central status service.' );
			}
		} );

		this.as.isAuthenticating$.pipe(
			withLatestFrom( this.as.user$ ),
			map( ( [isAuthenticating, user] ) => ( { isAuthenticating, user } ) )
		).subscribe( payload => {
			// console.log( 'Payload', payload );
			if ( payload.isAuthenticating ) this.processSignIn( payload.user );
		} );

		this.as.isReAuthenticating$.pipe( filter( a => a === true ) ).subscribe( payload => {
			this.processReauthenticate( this.as.encodedToken );
		} );
	}

	private communicate = ( payload: ATApiCommunication ) => {
		this.socket.emit( 'communication', { token: this.as.encodedToken, ...payload } );
	}

	private processSignIn = ( user: ATUser ) => {
		// console.log( 'We will now process SignIn', user );
		this.communicate( { framework: 'auth', action: 'signin', payload: { status: 'request', data: { username: user.email, password: user.password } } } );
	}

	private processReauthenticate = ( token: string ) => {
		// console.log( 'We will now reauthenticate user' );
		this.communicate( { framework: 'auth', action: 'reauthenticate', payload: { status: 'request', data: { token } } } );
	}

	private displayResponseDetails = ( response: ATApiCommunication ) => {
		console.log( '===========================================' );
		console.log( '===========================================' );
		console.log( 'Communication came from server' );
		console.log( 'Framework:', response.framework, 'Action:', response.action );
		console.log( 'Payload Status:', response.payload.status );
		console.log( 'Payload Result:', response.payload.data );
		console.log( '===========================================' );
		console.log( '===========================================' );
	}

	private showInterest = ( payload: ATDataStoreInterest[] ) => {
		this.socket.emit( 'interest', payload );
	}
}
