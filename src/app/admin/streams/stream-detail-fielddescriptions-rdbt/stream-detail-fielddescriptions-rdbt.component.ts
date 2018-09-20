import { Component, OnInit, OnDestroy } from '@angular/core';
import { AdminSharedService } from '../../admin-shared/admin-shared.service';
import { subsCreate, subsDispose } from 'shared/utilities/ngUtilities';
import { ATStream, getDefaultATStream, ATStreamField, ATStreamFieldDescription } from 'shared/models/at.stream';
import { DataStoreService } from '../../../data-store/data-store.service';
import { CentralStatusService } from '../../../central-status/central-status.service';
import { combineLatest, filter, map, debounce } from 'rxjs/operators';
import { timer } from 'rxjs';
import { StreamsService } from '../streams.service';
import { EnvironmentsService } from '../../environments/environments.service';
import { NgForm } from '@angular/forms';
import { SortByPosition } from 'shared/utilities/utilityFunctions';

@Component( {
	selector: 'app-stream-detail-fielddescriptions-rdbt',
	templateUrl: './stream-detail-fielddescriptions-rdbt.component.html',
	styleUrls: ['./stream-detail-fielddescriptions-rdbt.component.scss']
} )
export class StreamDetailFielddescriptionsRdbtComponent implements OnInit, OnDestroy {
	public cStream: ATStream = getDefaultATStream();
	public field = {
		description: {
			referenceField: {},
			descriptionField: {}
		}
	} as ATStreamField;
	private subs = subsCreate();

	public monacoOptions = { language: 'sql' };

	constructor(
		private ds: DataStoreService,
		private cs: CentralStatusService,
		public ss: AdminSharedService,
		public ms: StreamsService,
		private environmentService: EnvironmentsService
	) { }

	ngOnInit() {
		this.subs.push(
			this.ds.store.streams.subject.pipe(
				combineLatest( this.cs.currentID$ ),
				filter( ( [s, id] ) => ( !!s[id] ) ),
				map( ( [s, id] ) => s[id] ),
				combineLatest( this.cs.url$ ),
				debounce( () => timer( 250 ) )
			).subscribe( ( [s, url] ) => {
				this.cStream = s;
				const fieldIndex = this.cStream.fieldList.findIndex( f => f.name === url.split( '/' ).pop() );
				this.field = this.cStream.fieldList[fieldIndex];
				if ( !this.field.description ) this.field.description = {} as ATStreamFieldDescription;
				// this.field = { ...( { description: {} } as ATStreamField ), ...this.cStream.fieldList.find( f => f.name === url.split( '/' ).pop() ) };
				if ( !this.field.description.database ) this.field.description.database = this.cStream.dbName;
				if ( !this.field.description.tableList ) this.field.description.tableList = [];
				if ( this.field.description.tableList === [] && this.cStream.tableList && this.cStream.tableList !== [] && this.cStream.dbName === this.field.description.database ) this.field.description.tableList = this.cStream.tableList;
				if ( this.field.description.tableList.length === 0 && this.field.description.table ) this.field.description.tableList.push( { name: this.field.description.table } );
				if ( this.field.description.tableList.length < 2 ) this.refreshDescriptiveTables();
				if ( !this.field.description.referenceField ) this.field.description.referenceField = {} as any;
				if ( !this.field.description.descriptionField ) this.field.description.descriptionField = {} as any;
			} )
		);
	}

	public refreshDescriptiveTables = () => {
		this.environmentService.
			listTables( this.cStream.environment, this.field.description.database ).
			subscribe( r => this.field.description.tableList = r.data );
	}

	public refreshDatabases = () => {
		this.environmentService.
			listDatabases( this.cStream.environment ).
			subscribe( r => this.cStream.databaseList = r.data );
	}

	public codeCustomQuery = async ( f: NgForm ) => {
		const result = await this.cs.coder( this.field.description.query, this.monacoOptions, 'Custom Query for ' + this.field.name );
		if ( result !== false ) {
			this.field.description.query = result;
			this.ss.update( this.ms.framework, this.cStream, f );
		}
	}

	public refreshFields = () => {
		this.environmentService.
			listFields(
				this.cStream.environment,
				this.field.description.database,
				this.field.description.table,
				this.field.description.query
			).subscribe( r => this.field.description.fieldList = r.data.sort( SortByPosition ) );
	}

	public setFieldType = ( which: 'ref' | 'des' ) => {
		const cField = which === 'ref' ? this.field.description.referenceField : this.field.description.descriptionField;
		cField.type = this.field.description.fieldList.find( f => f.name === cField.name ).type;
		delete cField.characters;
		delete cField.dateformat;
		delete cField.precision;
		delete cField.decimals;
	}

	public tableChanged = () => {
		this.field.description.fieldList = [];
		this.field.description.referenceField = {} as any;
		this.field.description.descriptionField = {} as any;
	}

	ngOnDestroy() { subsDispose( this.subs ); }

}
