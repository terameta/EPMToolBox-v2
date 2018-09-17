import { Component, OnInit, OnDestroy } from '@angular/core';
import { AdminSharedService } from '../../admin-shared/admin-shared.service';
import { StreamsService } from '../streams.service';
import { ATStream, getDefaultATStream, atGetStreamTypeDescription, ATStreamType } from '../../../../../shared/models/at.stream';
import { Subscription, Subject } from 'rxjs';
import { DataStoreService } from '../../../data-store/data-store.service';
import { combineLatest, filter, switchMap } from 'rxjs/operators';
import { CentralStatusService } from '../../../central-status/central-status.service';
import { ATEnvironmentType } from 'shared/models/at.environment';
import { EnvironmentsService } from '../../environments/environments.service';
import { ATApiPayload } from 'shared/models/at.socketrequest';
import { EnumToArray } from 'shared/utilities/utilityFunctions';
import { NgForm } from '@angular/forms';

@Component( {
	selector: 'app-stream-detail-definitions',
	templateUrl: './stream-detail-definitions.component.html',
	styleUrls: ['./stream-detail-definitions.component.scss']
} )
export class StreamDetailDefinitionsComponent implements OnInit, OnDestroy {
	public cStream: ATStream = <ATStream>{};
	public getTypeDescription = atGetStreamTypeDescription;
	public streamType = ATStreamType;
	public streamTypes = EnumToArray( ATStreamType );

	private databaseRefresh$ = new Subject();
	private tableRefresh$ = new Subject();

	private subscriptions: Subscription[] = [];

	public monacoOptions = { language: 'sql' };

	constructor(
		public ds: DataStoreService,
		public cs: CentralStatusService,
		public ss: AdminSharedService,
		public ms: StreamsService,
		private environmentService: EnvironmentsService
	) { }

	ngOnInit() {
		this.subscriptions.push( this.ds.store.streams.subject.
			pipe(
				combineLatest( this.cs.currentID$ ),
				filter( ( [s, id] ) => ( !!s[id] ) )
			).
			subscribe( ( [s, id] ) => {
				this.cStream = Object.assign( getDefaultATStream(), s[id] );
				if ( this.cStream.environment ) {
					this.refreshDatabases();
					this.handleDatabaseChange();
				}
			} )
		);
		this.databaseRefresh$.pipe(
			switchMap( () => this.environmentService.listDatabases( this.cStream.environment ) )
		).subscribe( this.handleListDatabases );
		this.tableRefresh$.pipe(
			filter( e => !!this.cStream.dbName ),
			switchMap( () => this.environmentService.listTables( this.cStream.environment, this.cStream.dbName ) )
		).subscribe( this.handleListTables );
	}

	ngOnDestroy() {
		this.subscriptions.forEach( s => s.unsubscribe() );
		this.subscriptions = [];
	}

	public handleEnvironmentChange = () => {
		const cEnvironment = this.ds.store.environments.subject.getValue()[this.cStream.environment];
		if ( cEnvironment ) {
			switch ( cEnvironment.type ) {
				case ATEnvironmentType.MSSQL:
				case ATEnvironmentType.ORADB:
					this.cStream.type = ATStreamType.RDBT;
					break;
				case ATEnvironmentType.HP:
				case ATEnvironmentType.PBCS:
					this.cStream.type = ATStreamType.HPDB;
					break;
				default:
					this.cStream.type = null;
			}
		} else {
			this.cStream.type = null;
		}
		this.cStream.dbName = null;
		this.cStream.tableName = null;
		this.cStream.databaseList = [];
		this.cStream.tableList = [];
		this.refreshDatabases();
	}

	public refreshDatabases = () => {
		this.databaseRefresh$.next();
	}

	private handleListDatabases = ( payload: ATApiPayload ) => {
		this.cStream.databaseList = payload.data;
	}

	public handleDatabaseChange = () => {
		this.refreshTables();
		if ( this.cStream.type === ATStreamType.RDBT ) this.cStream.tableList = [{ name: 'Custom Query', type: 'Custom Query' }];
		if ( this.cStream.type === ATStreamType.HPDB ) this.cStream.tableList = [];
		if ( this.cStream.tableName && this.cStream.tableName !== 'Custom Query' ) this.cStream.tableList.push( { name: this.cStream.tableName } );
	}

	public refreshTables = () => {
		this.tableRefresh$.next();
	}

	private handleListTables = ( payload: ATApiPayload ) => {
		this.cStream.tableList = payload.data;
	}

	public codeCustomQuery = async ( f: NgForm ) => {
		const result = await this.cs.coder( this.cStream.customQuery, this.monacoOptions, 'Custom Query for ' + this.cStream.name );
		if ( result !== false ) {
			this.cStream.customQuery = result;
			this.ss.update( this.ms.framework, this.cStream, f );
		}
	}
}
