import { Component, OnInit, OnDestroy } from '@angular/core';
import { DataStoreService } from '../../../data-store/data-store.service';
import { Subscription } from 'rxjs';
import { CentralStatusService } from '../../../central-status/central-status.service';
import { ATStream, getDefaultATStream, ATStreamType } from 'shared/models/at.stream';
import { combineLatest, filter, map } from 'rxjs/operators';

@Component( {
	selector: 'app-stream-detail-fields',
	templateUrl: './stream-detail-fields.component.html',
	styleUrls: ['./stream-detail-fields.component.scss']
} )
export class StreamDetailFieldsComponent implements OnInit, OnDestroy {
	public csType: ATStreamType = null;
	public streamType = ATStreamType;

	private subscriptions: Subscription[] = [];

	constructor(
		private ds: DataStoreService,
		private cs: CentralStatusService
	) {
		console.log( 'RDBT type streams should have the capabilitiy of having multiple data fields' );
	}

	ngOnInit() {
		this.subscriptions.push( this.ds.store.streams.subject.
			pipe(
				combineLatest( this.cs.currentID$ ),
				filter( ( [s, id] ) => ( !!s[id] ) ),
				map( ( [s, id] ) => ( s[id] ) )
			).
			subscribe( s => this.csType = s.type )
		);
	}

	ngOnDestroy() {
		this.subscriptions.forEach( s => s.unsubscribe() );
		this.subscriptions = [];
	}

}
