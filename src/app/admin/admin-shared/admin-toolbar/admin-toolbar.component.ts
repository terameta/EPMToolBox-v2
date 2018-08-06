import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { ATNamedBaseType } from 'shared/models/at.storeconcept';
import { DataStoreService } from '../../../data-store/data-store.service';
import { CentralStatusService } from '../../../central-status/central-status.service';
import { Subscription } from 'rxjs';
import { ATTag } from 'shared/models/at.tag';
import { ATTagGroup } from 'shared/models/at.taggroup';
import { Router } from '@angular/router';
import { CommunicationService } from '../../../communication/communication.service';

@Component( {
	selector: 'app-admin-toolbar',
	templateUrl: './admin-toolbar.component.html',
	styleUrls: ['./admin-toolbar.component.scss']
} )
export class AdminToolbarComponent implements OnInit, OnDestroy {
	@Input() items: ATNamedBaseType;
	@Input() concept: string;
	@Input() icon: string;

	public tags: ATTag[] = [];
	public tagGroups: ATTagGroup[] = [];

	private subscriptions: Subscription[] = [];

	constructor(
		private ds: DataStoreService,
		public ss: CentralStatusService,
		private cs: CommunicationService,
		private router: Router,
	) { }

	ngOnInit() {
		this.ds.showInterest( { concept: 'tags' } );
		this.ds.showInterest( { concept: 'taggroups' } );
		this.subscriptions.push( this.ds.store.tags.items.subscribe( ( i ) => { this.tags = i; } ) );
		this.subscriptions.push( this.ds.store.taggroups.items.subscribe( ( i ) => { this.tagGroups = i; } ) );
	}

	ngOnDestroy() {
		this.subscriptions.forEach( s => s.unsubscribe() );
	}

	public navigateTo = ( id: number ) => {
		this.router.navigateByUrl( '/admin/' + this.concept + '/' + id );
	}

	public create = async () => {
		const result = await this.ss.prompt( 'Please enter the name of the new item' );
		if ( !result ) return;
		this.cs.communicate( { framework: this.concept, action: 'create', payload: { status: 'request', data: { name: result } } }, true ).subscribe( ( response ) => {
			if ( response.data && response.data.id ) {
				this.navigateTo( response.data.id );
			}
		} );
	}

}
