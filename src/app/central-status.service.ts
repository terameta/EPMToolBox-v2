import { Injectable } from '@angular/core';
import { Router, NavigationEnd, Event } from '@angular/router';
import { ATNotification, ATNotificationDefault, newATNotification } from 'shared/models/notification';
import { BehaviorSubject } from 'rxjs';
import { JSONDeepCopy } from 'shared/utilities/utilityFunctions';
import { AuthService } from './auth/auth.service';

@Injectable( {
	providedIn: 'root'
} )
export class CentralStatusService {
	public currentURL = new BehaviorSubject<string>( '' );
	public shouldShowHeader = true;
	public shouldShowFooter = true;

	public notifications$ = new BehaviorSubject<ATNotification[]>( [] );

	public currentComponent = '';
	public currentID = 0;

	private urlsToHideHeader = [
		'/signin',
		'/signup'
	];
	private urlsToGoToHome = [
		'/',
		'/signin',
		'/signup'
	];

	constructor(
		private router: Router,
		private authService: AuthService
	) {
		this.router.events.subscribe( this.routeHandler );
		this.currentURL.subscribe( this.urlHandler );
		console.log( 'Constructed central-status.service' );
		setInterval( this.notificationClear, 10000 );
	}

	private routeHandler = ( event: Event ) => {
		if ( event instanceof NavigationEnd ) {
			this.currentURL.next( event.url );
			this.shouldShowHeader = true;
			this.shouldShowFooter = true;
			if ( this.urlsToHideHeader.includes( event.url ) ) {
				this.shouldShowHeader = false;
			}
		}
	}

	private urlHandler = ( url: string ) => {
		if ( this.authService.user$.getValue() ) {
			const role = this.authService.user$.getValue().role;
			if ( this.urlsToGoToHome.includes( url ) ) {
				if ( role === 'admin' ) {
					this.router.navigateByUrl( '/admin' );
				} else if ( role === 'user' ) {
					this.router.navigateByUrl( '/end-user' );
				}
			}
		}
		const urlSegments = url.split( '/' );
		if ( urlSegments.length < 3 ) {
			this.currentComponent = '';
		} else {
			this.currentComponent = urlSegments[2];
			if ( urlSegments.length < 4 ) {
				this.currentID = 0;
			} else {
				this.currentID = parseInt( urlSegments[3], 10 );
			}
		}
		console.log( url );
	}

	public notificationAdd = ( payload: ATNotification ) => this.notifications$.next( this.notifications$.getValue().concat( [{ ...newATNotification(), ...payload }] ) );
	private notificationClear = () => {
		const currentNotificationList = this.notifications$.getValue();
		const allNotificationCount = currentNotificationList.length;
		const unExpiredNotificationCount = currentNotificationList.filter( n => ( n.expires.getTime() > ( new Date() ).getTime() ) ).length;
		if ( allNotificationCount > unExpiredNotificationCount ) {
			this.notifications$.next( currentNotificationList.filter( n => ( n.expires.getTime() > ( new Date() ).getTime() ) ) );
		}
	}
}
