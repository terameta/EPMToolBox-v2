import { Component, OnInit, OnDestroy } from '@angular/core';
import { AdminSharedService } from '../../admin-shared/admin-shared.service';
import { StreamsService } from '../streams.service';
import { ATStream, getDefaultATStream } from '../../../../../shared/models/at.stream';
import { Subscription } from 'rxjs';
import { DataStoreService } from '../../../data-store/data-store.service';
import { combineLatest, filter } from 'rxjs/operators';
import { CentralStatusService } from '../../../central-status/central-status.service';
import { ATTag } from '../../../../../shared/models/at.tag';
import { ATTagGroup } from '../../../../../shared/models/at.taggroup';
import { SortByName, SortByPosition } from '../../../../../shared/utilities/utilityFunctions';

@Component( {
	selector: 'app-stream-detail-definitions',
	templateUrl: './stream-detail-definitions.component.html',
	styleUrls: ['./stream-detail-definitions.component.scss']
} )
export class StreamDetailDefinitionsComponent implements OnInit, OnDestroy {
	public cStream: ATStream = <ATStream>{};
	public tags: ATTag[] = [];
	public tagGroups: ATTagGroup[] = [];

	private subscriptions: Subscription[] = [];

	constructor(
		private ds: DataStoreService,
		public cs: CentralStatusService,
		public ss: AdminSharedService,
		public ms: StreamsService
	) { }

	ngOnInit() {
		this.ds.showInterest( { concept: 'streams' } );
		this.ds.showInterest( { concept: 'tags' } );
		this.ds.showInterest( { concept: 'taggroups' } );
		this.subscriptions.push( this.ds.store.streams.subject.
			pipe(
				combineLatest( this.cs.currentIDO ),
				filter( ( [s, id] ) => ( !!s[id] ) )
			).
			subscribe( ( [s, id] ) => {
				this.cStream = Object.assign( getDefaultATStream(), s[id] );
			} )
		);
		this.subscriptions.push( this.ds.store.tags.items.subscribe( c => this.tags = c.sort( SortByName ) ) );
		this.subscriptions.push( this.ds.store.taggroups.items.subscribe( c => this.tagGroups = c.sort( SortByPosition ) ) );
	}

	ngOnDestroy() {
		this.subscriptions.forEach( s => s.unsubscribe() );
		this.subscriptions = [];
	}

}
