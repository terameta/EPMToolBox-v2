import { Component, OnInit, OnDestroy } from '@angular/core';
import { ATTagGroup } from 'shared/models/at.taggroup';
import { subsCreate, subsDispose } from 'shared/utilities/ngUtilities';
import { DataStoreService } from '../../../data-store/data-store.service';
import { CentralStatusService } from '../../../central-status/central-status.service';
import { AdminSharedService } from '../../admin-shared/admin-shared.service';
import { debounce } from 'rxjs/operators';
import { timer } from 'rxjs';
import { positionMove } from 'shared/utilities/utilityFunctions';

@Component( {
	selector: 'app-tag-group-list',
	templateUrl: './tag-group-list.component.html',
	styleUrls: ['./tag-group-list.component.scss']
} )
export class TagGroupListComponent implements OnInit, OnDestroy {
	public taggroups: ATTagGroup[] = [];
	public concept = 'taggroups';

	private subs = subsCreate();

	constructor(
		private ds: DataStoreService,
		public cs: CentralStatusService,
		public ss: AdminSharedService
	) { }

	ngOnInit() {
		this.subs.push( this.ds.store.taggroups.items.
			pipe( debounce( () => timer( 100 ) ) ).
			subscribe( this.handleTagGroups ) );
	}

	ngOnDestroy() { subsDispose( this.subs ); }

	private handleTagGroups = ( list: ATTagGroup[] ) => {
		this.taggroups = list;
		list.forEach( ( g, i ) => {
			if ( g.position !== ( i + 1 ) ) {
				g.position = i + 1;
				this.ss.update( 'taggroups', g );
			}
		} );
	}

	public positionMove = ( index: number, direction: 1 | -1 ) => {
		positionMove( this.taggroups, index, direction );
		this.ss.update( this.concept, this.taggroups[index] );
		if ( this.taggroups[index + direction] ) this.ss.update( this.concept, this.taggroups[index + direction] );
	}

}
