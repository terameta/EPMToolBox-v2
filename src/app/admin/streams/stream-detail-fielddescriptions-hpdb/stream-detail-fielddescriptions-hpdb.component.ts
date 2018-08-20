import { Component, OnInit, OnDestroy } from '@angular/core';
import { DataStoreService } from '../../../data-store/data-store.service';
import { CentralStatusService } from '../../../central-status/central-status.service';
import { ATStream, getDefaultATStream } from 'shared/models/at.stream';
import { Subscription } from 'rxjs';
import { combineLatest, filter, map } from 'rxjs/operators';
import { AdminSharedService } from '../../admin-shared/admin-shared.service';
import { StreamsService } from '../streams.service';

@Component( {
	selector: 'app-stream-detail-fielddescriptions-hpdb',
	templateUrl: './stream-detail-fielddescriptions-hpdb.component.html',
	styleUrls: ['./stream-detail-fielddescriptions-hpdb.component.scss']
} )
export class StreamDetailFielddescriptionsHpdbComponent implements OnInit, OnDestroy {
	public cStream: ATStream = getDefaultATStream();

	private subscriptions: Subscription[] = [];

	constructor(
		private ds: DataStoreService,
		private cs: CentralStatusService,
		public ss: AdminSharedService,
		public ms: StreamsService
	) { }

	ngOnInit() {
		this.subscriptions.push( this.ds.store.streams.subject.
			pipe(
				combineLatest( this.cs.currentID$ ),
				filter( ( [s, id] ) => ( !!s[id] ) ),
				map( ( [s, id] ) => ( s[id] ) )
			).
			subscribe( s => this.cStream = s )
		);
	}

	ngOnDestroy() {
		this.subscriptions.forEach( s => s.unsubscribe() );
		this.subscriptions = [];
	}

}
