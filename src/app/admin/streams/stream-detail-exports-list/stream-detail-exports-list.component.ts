import { Component, OnInit, OnDestroy } from '@angular/core';
import { subsCreate, subsDispose } from 'shared/utilities/ngUtilities';
import { DataStoreService } from '../../../data-store/data-store.service';
import { combineLatest, filter, map } from 'rxjs/operators';
import { CentralStatusService } from '../../../central-status/central-status.service';
import { ATStreamExport, ATStream, getDefaultATStream } from 'shared/models/at.stream';
import { AdminSharedService } from '../../admin-shared/admin-shared.service';
import { StreamsService } from '../streams.service';

@Component( {
	selector: 'app-stream-detail-exports-list',
	templateUrl: './stream-detail-exports-list.component.html',
	styleUrls: ['./stream-detail-exports-list.component.scss']
} )
export class StreamDetailExportsListComponent implements OnInit, OnDestroy {
	public exports: ATStreamExport[] = [];
	public item: ATStream = getDefaultATStream();
	public itemLoaded = false;

	private subs = subsCreate();

	constructor(
		private ds: DataStoreService,
		private cs: CentralStatusService,
		public ss: AdminSharedService,
		public ms: StreamsService
	) { }

	ngOnInit() {
		this.subs.push( this.ds.store.streams.subject.
			pipe(
				combineLatest( this.cs.currentID$ ),
				filter( ( [s, id] ) => ( !!s[id] ) ),
				map( ( [s, id] ) => ( s[id] ) )
			).
			subscribe( s => {
				this.item = s;
				this.exports = this.item.exports;
				this.itemLoaded = true;
			} ) );
	}

	ngOnDestroy() { subsDispose( this.subs ); }

	public delete = async ( index: number ) => {
		const name = this.exports[index].name;
		const confirmed = await this.cs.confirm( 'Are you sure you want to delete ' + name );
		if ( confirmed ) {
			this.exports.splice( index, 1 );
			this.ss.update( 'streams', this.item );
		}
	}

}
