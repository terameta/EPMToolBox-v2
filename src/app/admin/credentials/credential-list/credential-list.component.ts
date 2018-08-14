import { Component, OnInit, OnDestroy } from '@angular/core';
import { ATCredential } from 'shared/models/at.credential';
import { Subscription } from 'rxjs';
import { DataStoreService } from '../../../data-store/data-store.service';
import { CentralStatusService } from '../../../central-status/central-status.service';
import { CredentialsService } from '../credentials.service';

@Component( {
	selector: 'app-credential-list',
	templateUrl: './credential-list.component.html',
	styleUrls: ['./credential-list.component.scss']
} )
export class CredentialListComponent implements OnInit, OnDestroy {
	public credentials: ATCredential[] = [];

	private subscriptions: Subscription[] = [];

	constructor(
		private ds: DataStoreService,
		public ss: CentralStatusService,
		public ms: CredentialsService
	) {
		this.subscriptions.push( this.ds.store.credentials.items.subscribe( i => this.credentials = i ) );
	}

	ngOnInit() {
	}

	ngOnDestroy() {
		this.subscriptions.forEach( s => s.unsubscribe() );
		this.subscriptions = [];
	}

}
