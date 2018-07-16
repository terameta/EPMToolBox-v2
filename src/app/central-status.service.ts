import { Injectable } from '@angular/core';
import { Router, NavigationEnd, Event } from '@angular/router';

@Injectable( {
	providedIn: 'root'
} )
export class CentralStatusService {
	public currentURL = '';
	public shouldShowHeader = true;
	public shouldShowFooter = true;

	private urlsToHideHeader = [
		'/signin'
	];

	constructor(
		private router: Router
	) {
		this.router.events.subscribe( this.routeHandler );
	}

	private routeHandler = ( event: Event ) => {
		if ( event instanceof NavigationEnd ) {
			this.currentURL = event.url;
			this.shouldShowHeader = true;
			this.shouldShowFooter = true;
			// if ( this.urlsToHideHeader.includes( this.currentURL ) ) {
			if ( this.currentURL in this.urlsToHideHeader ) {
				console.log( 'We will hide header' );
				this.shouldShowHeader = false;
			} else {
				console.log( 'We will not hide header' );
			}
		}
	}
}
