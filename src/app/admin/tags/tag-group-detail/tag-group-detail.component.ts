import { Component, OnInit, OnDestroy } from '@angular/core';
import { AdminSharedService } from '../../admin-shared/admin-shared.service';
import { DataStoreService } from '../../../data-store/data-store.service';
import { ATTagGroup, getDefaultATTagGroup } from 'shared/models/at.taggroup';
import { subsCreate, subsDispose } from 'shared/utilities/ngUtilities';
import { CentralStatusService } from '../../../central-status/central-status.service';
import { combineLatest, filter, map } from 'rxjs/operators';
import { ATTag } from 'shared/models/at.tag';
import { SortByName } from 'shared/utilities/utilityFunctions';
import { TagsService } from '../tags.service';

@Component( {
	selector: 'app-tag-group-detail',
	templateUrl: './tag-group-detail.component.html',
	styleUrls: ['./tag-group-detail.component.scss']
} )
export class TagGroupDetailComponent implements OnInit, OnDestroy {
	public taggroup: ATTagGroup = getDefaultATTagGroup();
	public framework = 'taggroups';
	public tags: ATTag[] = [];

	private subs = subsCreate();

	constructor(
		private ds: DataStoreService,
		private cs: CentralStatusService,
		public ss: AdminSharedService,
		public tagService: TagsService
	) { }

	ngOnInit() {
		this.subs.push(
			this.ds.store.taggroups.subject.
				pipe(
					combineLatest( this.cs.currentID$ ),
					filter( ( [s, id] ) => ( !!s[id] ) ),
					map( ( [s, id] ) => ( s[id] ) )
				).
				subscribe( c => this.taggroup = { ...getDefaultATTagGroup(), ...c } )
		);
		this.subs.push( this.ds.store.tags.items.subscribe( c => this.tags = c.sort( SortByName ) ) );
	}

	ngOnDestroy() { subsDispose( this.subs ); }

}
