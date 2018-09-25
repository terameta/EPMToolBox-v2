import { Component, OnInit, OnDestroy } from '@angular/core';
import { getDefaultATStream, getDefaultATStreamExportHPDB } from 'shared/models/at.stream';
import { subsCreate, subsDispose } from 'shared/utilities/ngUtilities';
import { DataStoreService } from '../../../data-store/data-store.service';
import { CentralStatusService } from '../../../central-status/central-status.service';
import { AdminSharedService } from '../../admin-shared/admin-shared.service';
import { combineLatest, filter, map, debounce } from 'rxjs/operators';
import { timer } from 'rxjs';
import { NgForm } from '@angular/forms';
import { JSONDeepCopy, SortByName } from 'shared/utilities/utilityFunctions';

@Component( {
	selector: 'app-stream-detail-export-detail-hpdb',
	templateUrl: './stream-detail-export-detail-hpdb.component.html',
	styleUrls: ['./stream-detail-export-detail-hpdb.component.scss']
} )
export class StreamDetailExportDetailHpdbComponent implements OnInit, OnDestroy {
	public framework = 'streams';
	public cStream = getDefaultATStream();
	public cExport = getDefaultATStreamExportHPDB();
	public cellCount = 0;
	private exportIndex = null;

	private subs = subsCreate();

	constructor(
		private ds: DataStoreService,
		private cs: CentralStatusService,
		public ss: AdminSharedService
	) { }

	ngOnInit() {
		this.subs.push( this.ds.store.streams.subject.
			pipe(
				combineLatest( this.cs.currentID$ ),
				filter( ( [s, id] ) => ( !!s[id] ) ),
				map( ( [s, id] ) => ( s[id] ) ),
				combineLatest( this.cs.url$ ),
				debounce( () => timer( 250 ) )
			).
			subscribe( ( [s, url] ) => {
				this.exportIndex = url.split( '/' ).pop();
				this.cStream = s;
				this.cExport = { ...getDefaultATStreamExportHPDB(), ...this.cStream.exports[this.exportIndex] };

			} )
		);
	}

	public delete = async () => {
		const response = await this.cs.confirm( 'Are you sure you want to delete ' + this.cExport.name );
		if ( response ) {
			this.cStream.exports.splice( this.exportIndex, 1 );
			this.ss.update( this.framework, this.cStream );
			this.ss.navigateByUrl( '/admin/streams/' + this.cStream.id + '/exports' );
		}
	}

	public clone = async () => {
		const response = await this.cs.prompt( 'What is the name of the new export?' );
		if ( response ) {
			this.cStream.exports.push( JSONDeepCopy( { ...this.cExport, ...{ name: response } } ) );
			this.cStream.exports.sort( SortByName );
			const cIndex = this.cStream.exports.findIndex( e => e.name === response );
			this.ss.update( this.framework, this.cStream );
			this.ss.navigateByUrl( '/admin/streams/' + this.cStream.id + '/exports/' + cIndex );
		}
	}

	ngOnDestroy() { subsDispose( this.subs ); }

}
