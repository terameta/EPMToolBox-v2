import { Component, OnInit, OnDestroy } from '@angular/core';
import { ATStream, getDefaultATStream } from 'shared/models/at.stream';
import { DataStoreService } from '../../../data-store/data-store.service';
import { Subscription } from 'rxjs';
import { CentralStatusService } from '../../../central-status/central-status.service';
import { combineLatest, filter, map } from 'rxjs/operators';

@Component( {
	selector: 'app-stream-detail-fielddescriptions',
	templateUrl: './stream-detail-fielddescriptions.component.html',
	styleUrls: ['./stream-detail-fielddescriptions.component.scss']
} )
export class StreamDetailFielddescriptionsComponent implements OnInit, OnDestroy {
	public item: ATStream = getDefaultATStream();
	public doWeHaveDescribedFields = false;

	private subscriptions: Subscription[] = [];

	constructor(
		private ds: DataStoreService,
		private cs: CentralStatusService
	) { }

	ngOnInit() {
		this.subscriptions.push( this.ds.store.streams.subject.
			pipe(
				combineLatest( this.cs.currentID$ ),
				filter( ( [s, id] ) => ( !!s[id] ) ),
				map( ( [s, id] ) => ( s[id] ) ),
				combineLatest( this.cs.url$ )
			).
			subscribe( ( [s, url] ) => {
				this.item = s;
				this.doWeHaveDescribedFields = this.item.fieldList.filter( f => f.isDescribed ).length > 0;
				if ( url.split( '/' ).pop() === 'fielddescriptions' ) {
					if ( this.item.fieldList.filter( f => f.isDescribed )[0] ) {
						this.cs.goto( url + '/' + this.item.fieldList.filter( f => f.isDescribed )[0].name );
					}
				}
			} )
		);
	}

	ngOnDestroy() {
		this.subscriptions.forEach( s => s.unsubscribe() );
		this.subscriptions = [];
	}

}
