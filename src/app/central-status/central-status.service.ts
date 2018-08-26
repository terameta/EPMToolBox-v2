import { Injectable } from '@angular/core';
import { Router, NavigationEnd, Event } from '@angular/router';
import { ATNotification, newATNotification } from 'shared/models/notification';
import { BehaviorSubject } from 'rxjs';
import { JSONDeepCopy } from 'shared/utilities/utilityFunctions';
import { AuthService } from '../auth/auth.service';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import { ConfirmComponent } from './confirm/confirm.component';
import { PromptComponent } from './prompt/prompt.component';

@Injectable( {
	providedIn: 'root'
} )
export class CentralStatusService {
	public url$ = new BehaviorSubject<string>( '' );
	public shouldShowHeader = true;
	public shouldShowFooter = true;

	public notifications$ = new BehaviorSubject<ATNotification[]>( [] );

	public currentComponent = '';
	public currentComponent$ = new BehaviorSubject( '' );
	public currentID = 0;
	public currentID$ = new BehaviorSubject( 0 );

	public selectedTags: any = {};

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
		private authService: AuthService,
		private modalService: BsModalService
	) {
		this.router.events.subscribe( this.routeHandler );
		this.url$.subscribe( this.urlHandler );
		// console.log( 'Constructed central-status.service' );
		setInterval( this.notificationClear, 1000 );
		if ( localStorage.getItem( 'selectedTags' ) ) this.selectedTags = JSON.parse( localStorage.getItem( 'selectedTags' ) );
	}

	private routeHandler = ( event: Event ) => {
		if ( event instanceof NavigationEnd ) {
			this.url$.next( event.url );
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
		this.currentComponent$.next( this.currentComponent );
		this.currentID$.next( this.currentID );
	}

	public notificationAdd = ( payload: ATNotification ) => this.notifications$.next( this.notifications$.getValue().concat( [{ ...newATNotification(), ...payload }] ) );
	public notificationUpdate = ( id: string, payload: ATNotification ) => this.notifications$.next( this.notifications$.getValue().map( n => ( n.id === id ? payload : n ) ) );

	private notificationClear = () => {
		const currentNotificationList = this.notifications$.getValue();
		const allNotificationCount = currentNotificationList.length;
		const unExpiredNotificationCount = currentNotificationList.filter( n => ( n.expires.getTime() > ( new Date() ).getTime() ) ).length;
		if ( allNotificationCount > unExpiredNotificationCount ) {
			this.notifications$.next( currentNotificationList.filter( n => ( n.expires.getTime() > ( new Date() ).getTime() ) ) );
		}
	}

	public tagChanged = ( groupid: number, tagid: number ) => {
		this.selectedTags[groupid.toString()] = tagid;
		localStorage.setItem( 'selectedTags', JSON.stringify( this.selectedTags ) );
	}

	public shouldListItem = ( tags: any ) => {
		let shouldShow = true;
		const filterers = Object.values( this.selectedTags ).filter( t => ( t !== undefined && t !== null && t !== 0 && t !== '0' ) );
		filterers.forEach( currentFilter => {
			if ( tags[currentFilter.toString()] !== true ) shouldShow = false;
		} );
		return shouldShow;
	}

	public confirm = ( question: string ) => {
		const modalRef: BsModalRef = this.modalService.show( ConfirmComponent, { initialState: { question } } );
		return new Promise( ( resolve, reject ) => {
			modalRef.content.onClose.subscribe( resolve, reject );
		} );
	}

	public prompt = ( question: string ) => {
		const modalRef: BsModalRef = this.modalService.show( PromptComponent, { initialState: { question } } );
		return new Promise( ( resolve, reject ) => {
			modalRef.content.onClose.subscribe( resolve, reject );
		} );
	}

	public goto = ( targetURL: string ) => this.router.navigateByUrl( targetURL );
}
