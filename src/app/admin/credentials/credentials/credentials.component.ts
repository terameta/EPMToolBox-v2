import { Component, OnInit, OnDestroy } from '@angular/core';
import { DataStoreService } from '../../../data-store/data-store.service';
import { ATCredential } from 'shared/models/at.credential';
import { Subscription } from 'rxjs';

@Component( {
	selector: 'app-credentials',
	templateUrl: './credentials.component.html',
	styleUrls: ['./credentials.component.scss']
} )
export class CredentialsComponent implements OnInit, OnDestroy {
	public credentials: ATCredential[] = [];

	private subscriptions: Subscription[] = [];

	constructor( private ds: DataStoreService ) { }

	ngOnInit() {
		this.ds.showInterest( { concept: 'credentials' } );
		this.subscriptions.push( this.ds.store.credentials.items.subscribe( i => this.credentials = i ) );
	}

	ngOnDestroy() {
		this.subscriptions.forEach( s => s.unsubscribe() );
	}

}
