import { Component, OnInit, OnDestroy } from '@angular/core';
import { ATStream, atGetStreamTypeDescription, ATStreamType } from 'shared/models/at.stream';
import { Subscription } from 'rxjs';
import { DataStoreService } from '../../../data-store/data-store.service';
import { CentralStatusService } from '../../../central-status/central-status.service';
import { StreamsService } from '../streams.service';
import { ATStoreSubject } from '../../../../../shared/models/at.storeconcept';
import { ATEnvironment } from '../../../../../shared/models/at.environment';
import { AdminSharedService } from '../../admin-shared/admin-shared.service';

@Component( {
	selector: 'app-stream-list',
	templateUrl: './stream-list.component.html',
	styleUrls: ['./stream-list.component.scss']
} )
export class StreamListComponent implements OnInit, OnDestroy {
	public streams: ATStream[] = [];
	public environments: ATStoreSubject<ATEnvironment> = {};
	public getStreamTypeDescription = atGetStreamTypeDescription;
	public streamTypes = ATStreamType;

	private subscriptions: Subscription[] = [];

	constructor(
		private ds: DataStoreService,
		public cs: CentralStatusService,
		public ss: AdminSharedService,
		public ms: StreamsService
	) {
		this.subscriptions.push( this.ds.store.streams.items.subscribe( i => this.streams = i ) );
		this.subscriptions.push( this.ds.store.environments.subject.subscribe( i => this.environments = i ) );
	}

	ngOnInit() {
	}

	ngOnDestroy() {
		this.subscriptions.forEach( s => s.unsubscribe() );
		this.subscriptions = [];
	}

}
