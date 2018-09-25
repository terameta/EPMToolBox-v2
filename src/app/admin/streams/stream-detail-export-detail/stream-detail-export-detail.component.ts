import { Component, OnInit, OnDestroy } from '@angular/core';
import { subsDispose, subsCreate } from 'shared/utilities/ngUtilities';
import { DataStoreService } from '../../../data-store/data-store.service';
import { CentralStatusService } from '../../../central-status/central-status.service';
import { combineLatest, filter, map } from 'rxjs/operators';
import { ATStreamType } from 'shared/models/at.stream';

@Component( {
	selector: 'app-stream-detail-export-detail',
	templateUrl: './stream-detail-export-detail.component.html',
	styleUrls: ['./stream-detail-export-detail.component.scss']
} )
export class StreamDetailExportDetailComponent implements OnInit, OnDestroy {
	public streamTypes = ATStreamType;
	public streamType: ATStreamType = null;

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
				map( ( [s, id] ) => ( s[id] ) )
			).
			subscribe( s => {
				this.streamType = s.type;
			} ) );
	}

	ngOnDestroy() { subsDispose( this.subs ); }

}
