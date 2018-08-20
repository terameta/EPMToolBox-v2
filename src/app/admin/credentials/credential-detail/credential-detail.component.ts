import { Component, OnInit, OnDestroy } from '@angular/core';
import { DataStoreService } from '../../../data-store/data-store.service';
import { CentralStatusService } from '../../../central-status/central-status.service';
import { CredentialsService } from '../credentials.service';
import { ATTagGroup } from 'shared/models/at.taggroup';
import { ATTag } from 'shared/models/at.tag';
import { ATCredential, getDefaultATCredential } from 'shared/models/at.credential';
import { Subscription } from 'rxjs';
import { combineLatest, filter } from 'rxjs/operators';
import { SortByName, SortByPosition } from 'shared/utilities/utilityFunctions';

@Component( {
	selector: 'app-credential-detail',
	templateUrl: './credential-detail.component.html',
	styleUrls: ['./credential-detail.component.scss']
} )
export class CredentialDetailComponent implements OnInit, OnDestroy {
	public credential: ATCredential = getDefaultATCredential();
	public tags: ATTag[] = [];
	public tagGroups: ATTagGroup[] = [];

	private subscriptions: Subscription[] = [];

	public revealedPassword = '';
	public isRevealed = false;

	constructor(
		private ds: DataStoreService,
		public ss: CentralStatusService,
		public ms: CredentialsService
	) { }

	ngOnInit() {
		this.subscriptions.push( this.ds.store.credentials.subject.
			pipe(
				combineLatest( this.ss.currentID$ ),
				filter( ( [s, id] ) => ( !!s[id] ) )
			).
			subscribe( ( [s, id] ) => {
				this.credential = Object.assign( getDefaultATCredential(), s[id] );
			} ) );
		this.subscriptions.push( this.ds.store.tags.items.subscribe( c => this.tags = c.sort( SortByName ) ) );
		this.subscriptions.push( this.ds.store.taggroups.items.subscribe( c => this.tagGroups = c.sort( SortByPosition ) ) );
	}

	ngOnDestroy() {
		this.subscriptions.forEach( s => s.unsubscribe() );
		this.subscriptions = [];
	}

	public reveal = () => {
		this.isRevealed = !this.isRevealed;
		if ( this.isRevealed && this.revealedPassword === '' ) this.ms.reveal( this.credential.id ).then( r => this.revealedPassword = r );
	}

	public passwordChanged = () => {
		this.isRevealed = false;
		this.revealedPassword = '';
	}

}
