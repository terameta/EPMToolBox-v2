import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { DataStoreService } from '../../../data-store/data-store.service';
import { CentralStatusService } from '../../../central-status/central-status.service';
import { AdminSharedService } from '../../admin-shared/admin-shared.service';
import { ATTagGroup } from 'shared/models/at.taggroup';
import { subsCreate, subsDispose } from 'shared/utilities/ngUtilities';

@Component( {
	selector: 'app-tag-list',
	templateUrl: './tag-list.component.html',
	styleUrls: ['./tag-list.component.scss']
} )
export class TagListComponent implements OnInit, OnDestroy {
	public tagGroups: ATTagGroup[] = [];

	private subs = subsCreate();

	constructor(
		private ds: DataStoreService,
		private cs: CentralStatusService,
		private ss: AdminSharedService
	) { }

	ngOnInit() {
		this.subs.push( this.ds.store.taggroups.items.subscribe( i => this.tagGroups = i ) );
	}

	ngOnDestroy() { subsDispose( this.subs ); }

}
