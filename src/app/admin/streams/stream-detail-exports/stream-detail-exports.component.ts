import { Component, OnInit, OnDestroy } from '@angular/core';
import { getDefaultATStream } from 'shared/models/at.stream';
import { subsCreate, subsDispose } from 'shared/utilities/ngUtilities';
import { DataStoreService } from '../../../data-store/data-store.service';
import { CentralStatusService } from '../../../central-status/central-status.service';
import { combineLatest, filter, map } from 'rxjs/operators';

@Component( {
	selector: 'app-stream-detail-exports',
	templateUrl: './stream-detail-exports.component.html',
	styleUrls: ['./stream-detail-exports.component.scss']
} )
export class StreamDetailExportsComponent implements OnInit, OnDestroy {
	public item = getDefaultATStream();

	private subs = subsCreate();

	constructor(
		private ds: DataStoreService,
		private cs: CentralStatusService
	) { }

	ngOnInit() {
		this.subs.push( this.ds.store.streams.subject.
			pipe(
				combineLatest( this.cs.currentID$ ),
				filter( ( [s, id] ) => ( !!s[id] ) ),
				map( ( [s, id] ) => ( s[id] ) ),
				combineLatest( this.cs.url$ )
			).
			subscribe( ( [s, url] ) => {
				this.item = s;
			} )
		);
	}

	ngOnDestroy() { subsDispose( this.subs ); }

}
