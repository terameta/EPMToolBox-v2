import { Component, OnInit, OnDestroy } from '@angular/core';
import { DataStoreService } from '../../../data-store/data-store.service';
import { CentralStatusService } from '../../../central-status/central-status.service';
import { Subscription } from 'rxjs';
import { combineLatest, filter, map } from 'rxjs/operators';
import { ATStreamType } from 'shared/models/at.stream';

@Component( {
	selector: 'app-stream-detail-fielddescriptions-selector',
	templateUrl: './stream-detail-fielddescriptions-selector.component.html',
	styleUrls: ['./stream-detail-fielddescriptions-selector.component.scss']
} )
export class StreamDetailFielddescriptionsSelectorComponent implements OnInit, OnDestroy {
	private subscriptions: Subscription[] = [];

	public streamType = ATStreamType;
	public csType: ATStreamType = null;

	constructor(
		private ds: DataStoreService,
		private cs: CentralStatusService
	) { }

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
