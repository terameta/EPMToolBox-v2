import { Injectable } from '@angular/core';
import { Router, NavigationEnd, Event } from '@angular/router';
import { ATNotification, ATNotificationDefault, newATNotification } from 'shared/models/notification';
import { BehaviorSubject } from 'rxjs';
import { JSONDeepCopy } from 'shared/utilities/utilityFunctions';

@Injectable( {
	providedIn: 'root'
} )
export class CentralStatusService {
	public currentURL = '';
	public shouldShowHeader = true;
	public shouldShowFooter = true;

	public notifications$ = new BehaviorSubject<ATNotification[]>( [] );

	private urlsToHideHeader = [
		'/signin'
	];

	constructor(
		private router: Router
	) {
		this.router.events.subscribe( this.routeHandler );
		console.log( 'Constructed central-status.service' );
		setInterval( this.notificationClear, 1000 );
	}

	private routeHandler = ( event: Event ) => {
		if ( event instanceof NavigationEnd ) {
			this.currentURL = event.url;
			this.shouldShowHeader = true;
			this.shouldShowFooter = true;
			if ( this.urlsToHideHeader.includes( this.currentURL ) ) {
				console.log( 'We will hide header', this.currentURL );
				this.shouldShowHeader = false;
			} else {
				console.log( 'We will not hide header', this.currentURL );
			}
		}
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
