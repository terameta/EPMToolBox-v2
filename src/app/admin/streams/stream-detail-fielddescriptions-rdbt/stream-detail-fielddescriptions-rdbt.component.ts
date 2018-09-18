import { Component, OnInit, OnDestroy } from '@angular/core';
import { AdminSharedService } from '../../admin-shared/admin-shared.service';
import { subsCreate, subsDispose } from 'shared/utilities/ngUtilities';
import { ATStream, getDefaultATStream, ATStreamField } from 'shared/models/at.stream';
import { DataStoreService } from '../../../data-store/data-store.service';
import { CentralStatusService } from '../../../central-status/central-status.service';
import { combineLatest, filter, map, debounce } from 'rxjs/operators';
import { timer } from 'rxjs';

@Component( {
	selector: 'app-stream-detail-fielddescriptions-rdbt',
	templateUrl: './stream-detail-fielddescriptions-rdbt.component.html',
	styleUrls: ['./stream-detail-fielddescriptions-rdbt.component.scss']
} )
export class StreamDetailFielddescriptionsRdbtComponent implements OnInit, OnDestroy {
	public cStream: ATStream = getDefaultATStream();
	public field = { description: {} } as ATStreamField;
	private subs = subsCreate();

	constructor(
		private ds: DataStoreService,
		private cs: CentralStatusService,
		public ss: AdminSharedService
	) { }

	ngOnInit() {
		this.subs.push(
			this.ds.store.streams.subject.pipe(
				combineLatest( this.cs.currentID$ ),
				filter( ( [s, id] ) => ( !!s[id] ) ),
				map( ( [s, id] ) => s[id] ),
				debounce( () => timer( 250 ) )
			).subscribe( console.log )
		);
	}

	ngOnDestroy() { subsDispose( this.subs ); }

}
