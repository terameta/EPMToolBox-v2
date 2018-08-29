import { Component, OnInit, OnDestroy } from '@angular/core';
import { ATTagGroup } from 'shared/models/at.taggroup';
import { subsCreate, subsDispose } from 'shared/utilities/ngUtilities';
import { DataStoreService } from '../../../data-store/data-store.service';

@Component( {
	selector: 'app-tags',
	templateUrl: './tags.component.html',
	styleUrls: ['./tags.component.scss']
} )
export class TagsComponent implements OnInit, OnDestroy {
	public tagGroups: ATTagGroup[] = [];

	private subs = subsCreate();

	constructor( private ds: DataStoreService ) { }

	ngOnInit() { this.subs.push( this.ds.store.taggroups.items.subscribe( i => this.tagGroups = i ) ); }

	ngOnDestroy() { subsDispose( this.subs ); }

}
