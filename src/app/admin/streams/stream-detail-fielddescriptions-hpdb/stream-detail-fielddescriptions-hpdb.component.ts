import { Component, OnInit, OnDestroy } from '@angular/core';
import { DataStoreService } from '../../../data-store/data-store.service';
import { CentralStatusService } from '../../../central-status/central-status.service';
import { ATStream, getDefaultATStream, ATStreamField } from 'shared/models/at.stream';
import { Subscription, timer } from 'rxjs';
import { combineLatest, filter, map, debounce } from 'rxjs/operators';
import { AdminSharedService } from '../../admin-shared/admin-shared.service';
import { StreamsService } from '../streams.service';
import { EnvironmentsService } from '../../environments/environments.service';
import { NgForm } from '@angular/forms';

@Component( {
	selector: 'app-stream-detail-fielddescriptions-hpdb',
	templateUrl: './stream-detail-fielddescriptions-hpdb.component.html',
	styleUrls: ['./stream-detail-fielddescriptions-hpdb.component.scss']
} )
export class StreamDetailFielddescriptionsHpdbComponent implements OnInit, OnDestroy {
	public cStream: ATStream = getDefaultATStream();
	public field = { description: {} } as ATStreamField;

	private subscriptions: Subscription[] = [];

	constructor(
		private ds: DataStoreService,
		private cs: CentralStatusService,
		public ss: AdminSharedService,
		public ms: StreamsService,
		private environmentService: EnvironmentsService
	) { }

	ngOnInit() {
		this.subscriptions.push( this.ds.store.streams.subject.
			pipe(
				combineLatest( this.cs.currentID$ ),
				filter( ( [s, id] ) => ( !!s[id] ) ),
				map( ( [s, id] ) => ( s[id] ) ),
				combineLatest( this.cs.url$ ),
				debounce( () => timer( 250 ) )
			).
			subscribe( ( [s, url] ) => {
				this.cStream = s;
				this.field = this.cStream.fieldList.find( f => f.name === url.split( '/' ).pop() ) || ( { description: {} } as ATStreamField );
				if ( !this.field.description.database ) this.field.description.database = this.cStream.dbName;
				if ( !this.field.description.tableList ) this.field.description.tableList = [];
				if ( this.cStream && this.cStream.environment && this.field.description.database && this.cStream.tableName && this.field.description.tableList.length === 0 ) this.refreshAliasTables();
				if ( this.field.description.tableList.length === 0 && this.field.description.table ) this.field.description.tableList.push( { name: this.field.description.table } );
			} )
		);
	}

	ngOnDestroy() {
		this.subscriptions.forEach( s => s.unsubscribe() );
		this.subscriptions = [];
	}

	public refreshAliasTables = () => {
		this.environmentService.
			listDescriptiveTables( this.cStream.environment, this.field.description.database, this.cStream.tableName ).
			subscribe( r => this.field.description.tableList = r.data );
	}

	public setToAllFields = ( form: NgForm ) => {
		this.cStream.fieldList.forEach( f => {
			f.description.table = this.field.description.table;
		} );
		this.ss.update( this.ms.framework, this.cStream, form );
	}

}
