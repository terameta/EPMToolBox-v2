import { Component, OnInit, OnDestroy } from '@angular/core';
import { DataStoreService } from '../../data-store/data-store.service';
import { ATDataStoreInterest } from 'shared/models/at.datastoreinterest';
import { Subscription } from 'rxjs';
import { ATProcessStatus } from 'shared/models/at.process';

@Component( {
	selector: 'app-admin-front-page',
	templateUrl: './admin-front-page.component.html',
	styleUrls: ['./admin-front-page.component.scss']
} )
export class AdminFrontPageComponent implements OnInit, OnDestroy {
	private subscriptions: Subscription[] = [];

	public environmentCount = 0;
	public verifiedEnvironmentCount = 0;
	public streamCount = 0;
	public mapCount = 0;
	public matrixCount = 0;
	public scheduleCount = 0;
	public processCount = 0;
	public runningProcessCount = 0;
	public secretCount = 0;
	public credentialCount = 0;
	public userCount = 0;

	private interests: ATDataStoreInterest[] = [
		{ concept: 'environments' },
		{ concept: 'streams' },
		{ concept: 'maps' },
		{ concept: 'matrices' },
		{ concept: 'schedules' },
		{ concept: 'processes' },
		{ concept: 'secrets' },
		{ concept: 'credentials' },
		{ concept: 'users' }
	];

	constructor( public ds: DataStoreService ) { }

	ngOnInit() {

		// 	.subscribe( result => {
		// 	this.processCount = result.ids.length;
		// 	this.runningProcessCount = result.ids.map( id => result.subject[id] ).filter( e => e.status === ATProcessStatus.Running ).length;
		// } ) );

		this.interests.forEach( this.ds.showInterest );

		this.subscriptions.push( this.ds.store.environments.items.subscribe( s => { this.environmentCount = s.length; this.verifiedEnvironmentCount = s.filter( e => e.verified ).length; } ) );
		this.subscriptions.push( this.ds.store.streams.items.subscribe( s => this.streamCount = s.length ) );
		this.subscriptions.push( this.ds.store.maps.items.subscribe( s => this.mapCount = s.length ) );
		this.subscriptions.push( this.ds.store.matrices.items.subscribe( s => this.matrixCount = s.length ) );
		this.subscriptions.push( this.ds.store.schedules.items.subscribe( s => this.scheduleCount = s.length ) );
		this.subscriptions.push( this.ds.store.processes.items.subscribe( s => { this.processCount = s.length; this.runningProcessCount = s.filter( e => e.status === ATProcessStatus.Running ).length; } ) );
		this.subscriptions.push( this.ds.store.secrets.items.subscribe( s => this.secretCount = s.length ) );
		this.subscriptions.push( this.ds.store.credentials.items.subscribe( s => this.credentialCount = s.length ) );
		this.subscriptions.push( this.ds.store.users.items.subscribe( s => this.userCount = s.length ) );
	}

	ngOnDestroy() {
		this.interests.forEach( this.ds.looseInterest );
		this.subscriptions.forEach( s => s.unsubscribe() );
	}

}
