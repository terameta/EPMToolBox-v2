import { Component, OnInit, OnDestroy } from '@angular/core';
import { getDefaultATStream } from 'shared/models/at.stream';
import { subsCreate, subsDispose } from 'shared/utilities/ngUtilities';
import { DataStoreService } from '../../../data-store/data-store.service';
import { CentralStatusService } from '../../../central-status/central-status.service';
import { combineLatest, filter, map } from 'rxjs/operators';
import { AdminSharedService } from '../../admin-shared/admin-shared.service';
import { arrayContains, SortByName } from 'shared/utilities/utilityFunctions';

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
		private cs: CentralStatusService,
		private ss: AdminSharedService
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
				if ( !this.item.exports ) this.item.exports = [];
				this.item.exports.sort( SortByName );
			} )
		);
	}

	ngOnDestroy() { subsDispose( this.subs ); }

	public create = async () => {
		const name = ( await this.cs.prompt( 'What is the name of the new export?' ) ) as string;
		if ( name ) {
			if ( arrayContains( this.item.exports, 'name', name ) ) {
				await this.cs.notificationDisplay( {
					id: '-1',
					title: 'There is already an export with the same name',
					detail: 'Please try with another name',
					type: 'info'
				} );
				this.create();
			} else {
				this.item.exports.push( { name } );
				this.ss.update( 'streams', this.item );
			}
		}
	}

}
