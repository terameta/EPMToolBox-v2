import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';

import { DataStoreService } from '../../../data-store/data-store.service';
import { CentralStatusService } from '../../../central-status.service';
import { ATDataStoreInterest } from 'shared/models/at.datastoreinterest';
import { ATEnvironment } from 'shared/models/at.environment';
import { ATTag } from 'shared/models/at.tag';
import { ATTagGroup } from 'shared/models/at.taggroup';
import { Subscription } from 'rxjs';

@Component( {
	selector: 'app-environments-toolbar',
	templateUrl: './environments-toolbar.component.html',
	styleUrls: ['./environments-toolbar.component.scss']
} )
export class EnvironmentsToolbarComponent implements OnInit, OnDestroy {
	public environments: ATEnvironment[] = [];
	public tags: ATTag[] = [];
	public tagGroups: ATTagGroup[] = [];

	private subscriptions: Subscription[] = [];

	private interests: ATDataStoreInterest[] = [
		{ concept: 'environments' },
		{ concept: 'tags' },
		{ concept: 'taggroups' }
	];

	constructor(
		public ss: CentralStatusService,
		public ds: DataStoreService,
		private router: Router
	) { }

	ngOnInit() {
		this.interests.forEach( this.ds.showInterest );
		this.subscriptions.push( this.ds.store.environments.items.subscribe( ( i ) => { this.environments = i; } ) );
		this.subscriptions.push( this.ds.store.tags.items.subscribe( ( i ) => { this.tags = i; } ) );
		this.subscriptions.push( this.ds.store.taggroups.items.subscribe( ( i ) => { this.tagGroups = i; } ) );
	}

	ngOnDestroy() {
		this.interests.forEach( this.ds.looseInterest );
		this.subscriptions.forEach( s => s.unsubscribe() );
	}

	public navigateTo = ( id: number ) => {
		this.router.navigateByUrl( '/admin/environments/' + id );
	}

	public create = () => {
		// this.cs.communicate( {
		// 	framework: 'environments',
		// 	action: 'create',
		// 	payload: {
		// 		status: 'request',
		// 		data: {}
		// 	}
		// } );
		alert( 'We will work on this one' );
	}

}
