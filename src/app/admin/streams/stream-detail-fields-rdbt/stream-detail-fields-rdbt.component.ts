import { Component, OnInit, OnDestroy } from '@angular/core';
import { DataStoreService } from '../../../data-store/data-store.service';
import { CentralStatusService } from '../../../central-status/central-status.service';
import { StreamsService } from '../streams.service';
import { AdminSharedService } from '../../admin-shared/admin-shared.service';
import { EnvironmentsService } from '../../environments/environments.service';
import { ATStream, getDefaultATStream } from 'shared/models/at.stream';
import { Subscription } from 'rxjs';
import { ATApiPayload } from '../../../../../shared/models/at.socketrequest';
import { SortByPosition } from '../../../../../shared/utilities/utilityFunctions';
import { combineLatest, filter } from 'rxjs/operators';

@Component( {
	selector: 'app-stream-detail-fields-rdbt',
	templateUrl: './stream-detail-fields-rdbt.component.html',
	styleUrls: ['./stream-detail-fields-rdbt.component.scss']
} )
export class StreamDetailFieldsRdbtComponent implements OnInit, OnDestroy {
	public cStream: ATStream = getDefaultATStream();

	private subscriptions: Subscription[] = [];

	constructor(
		private ds: DataStoreService,
		private cs: CentralStatusService,
		public ms: StreamsService,
		public ss: AdminSharedService,
		public environmentService: EnvironmentsService
	) { }

	ngOnInit() {
		this.subscriptions.push( this.ds.store.streams.subject.
			pipe(
				combineLatest( this.cs.currentID$ ),
				filter( ( [s, id] ) => ( !!s[id] ) )
			).subscribe( ( [s, id] ) => {
				this.cStream = Object.assign( getDefaultATStream(), s[id] );
			} )
		);
	}

	ngOnDestroy() {
		this.subscriptions.forEach( s => s.unsubscribe() );
		this.subscriptions = [];
	}

	public fieldMove = ( index: number, direction: number ) => {
		this.cStream.fieldList.forEach( ( field, fieldIndex ) => {
			field.position = field.position * 10 + ( fieldIndex === index ? direction * 11 : 0 );
		} );
		this.cStream.fieldList.sort( SortByPosition );
		this.cStream.fieldList.forEach( ( field, fieldIndex ) => {
			field.position = fieldIndex + 1;
		} );
	}

	public listFields = () => {
		this.environmentService.listFields( this.cStream.environment, this.cStream.dbName, this.cStream.tableName, this.cStream.customQuery ).
			subscribe( ( payload: ATApiPayload ) => {
				this.cStream.fieldList = payload.data;
				this.ss.update( this.ms.framework, this.cStream );
			} );
	}

}
