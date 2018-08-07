import { Component, OnInit, OnDestroy } from '@angular/core';
import { EnumToArray, SortByName, SortByPosition } from 'shared/utilities/utilityFunctions';
import { ATEnvironment, getDefaultATEnvironment, ATEnvironmentType, atGetEnvironmentTypeDescription } from 'shared/models/at.environment';
import { Subscription } from 'rxjs';
import { DataStoreService } from '../../../data-store/data-store.service';
import { CentralStatusService } from '../../../central-status/central-status.service';
import { EnvironmentsService } from '../environments.service';
import { ATCredential } from 'shared/models/at.credential';
import { combineLatest, filter, tap } from 'rxjs/operators';
import { ATTag } from 'shared/models/at.tag';
import { ATTagGroup } from 'shared/models/at.taggroup';

@Component( {
	selector: 'app-environment-detail',
	templateUrl: './environment-detail.component.html',
	styleUrls: ['./environment-detail.component.scss']
} )
export class EnvironmentDetailComponent implements OnInit, OnDestroy {
	public environmentTypes = EnumToArray( ATEnvironmentType );
	public environmentType = ATEnvironmentType;
	public getTypeDescripton = atGetEnvironmentTypeDescription;
	public cEnvironment: ATEnvironment = getDefaultATEnvironment();
	public credentials: ATCredential[] = [];
	public tags: ATTag[] = [];
	public tagGroups: ATTagGroup[] = [];

	private subscriptions: Subscription[] = [];

	constructor(
		private ds: DataStoreService,
		public ss: CentralStatusService,
		public ms: EnvironmentsService
	) { }

	ngOnInit() {
		this.ds.showInterest( { concept: 'environments' } );
		this.ds.showInterest( { concept: 'credentials' } );
		this.ds.showInterest( { concept: 'tags' } );
		this.ds.showInterest( { concept: 'taggroups' } );
		this.subscriptions.push( this.ds.store.environments.subject.
			pipe(
				combineLatest( this.ss.currentIDO ),
				filter( ( [s, id] ) => ( !!s[id] ) )
			).
			subscribe( ( [s, id] ) => {
				// console.log( id, s );
				this.cEnvironment = Object.assign( getDefaultATEnvironment(), s[id] );
			} ) );
		this.subscriptions.push( this.ds.store.credentials.items.subscribe( c => this.credentials = c ) );
		this.subscriptions.push( this.ds.store.tags.items.subscribe( c => this.tags = c.sort( SortByName ) ) );
		this.subscriptions.push( this.ds.store.taggroups.items.subscribe( c => this.tagGroups = c.sort( SortByPosition ) ) );
	}

	ngOnDestroy() {
		this.subscriptions.forEach( s => s.unsubscribe() );
		this.subscriptions = [];
	}

	public decideColWidth = ( numCols: number ) => {
		let colWidth = 12;
		if ( numCols > 0 ) {
			colWidth = Math.floor( colWidth / numCols );
		}
		if ( colWidth < 1 ) { colWidth = 1; }
		return colWidth;
	}

}
