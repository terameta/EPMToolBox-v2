import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';

import { ATEnvironmentConcept } from '../../../../../shared/models/at.environment';
import { DataStoreService } from '../../../data-store/data-store.service';
import { ATTagConcept } from 'shared/models/at.tag';
import { ATTagGroupConcept } from 'shared/models/at.taggroup';
import { Subscription } from 'rxjs';
import { CentralStatusService } from '../../../central-status.service';
import { CommunicationService } from '../../../communication/communication.service';

@Component( {
	selector: 'app-environments-toolbar',
	templateUrl: './environments-toolbar.component.html',
	styleUrls: ['./environments-toolbar.component.scss']
} )
export class EnvironmentsToolbarComponent implements OnInit, OnDestroy {
	public environments: ATEnvironmentConcept;
	public tags: ATTagConcept;
	public taggroups: ATTagGroupConcept;

	private subscriptions: Subscription[] = [];

	constructor(
		public ss: CentralStatusService,
		public ds: DataStoreService,
		private cs: CommunicationService,
		private router: Router
	) {
		this.subscriptions.push( this.ds.showInterest<ATEnvironmentConcept>( { concept: 'environments' } ).subscribe( result => this.environments = result ) );
		this.subscriptions.push( this.ds.showInterest<ATTagConcept>( { concept: 'tags' } ).subscribe( result => this.tags = result ) );
		this.subscriptions.push( this.ds.showInterest<ATTagGroupConcept>( { concept: 'taggroups' } ).subscribe( result => this.taggroups = result ) );
	}

	ngOnInit() { }

	ngOnDestroy() {
		this.subscriptions.forEach( s => s.unsubscribe() );
		this.ds.looseInterest( { concept: 'environments' } );
		this.ds.looseInterest( { concept: 'tags' } );
		this.ds.looseInterest( { concept: 'taggroups' } );
	}

	public navigateTo = ( id: number ) => {
		this.router.navigateByUrl( '/admin/environments/' + id );
	}

	public create = () => {
		this.cs.communicate( {
			framework: 'environments',
			action: 'create',
			payload: {
				status: 'request',
				data: {}
			}
		} );
	}

}
