import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { DataStoreService } from '../../../data-store/data-store.service';
import { Subscription } from 'rxjs';
import { ATTag } from 'shared/models/at.tag';
import { ATTagGroup } from 'shared/models/at.taggroup';
import { SortByName, SortByPosition } from 'shared/utilities/utilityFunctions';

@Component( {
	selector: 'app-admin-tag-selector',
	templateUrl: './admin-tag-selector.component.html',
	styleUrls: ['./admin-tag-selector.component.scss']
} )
export class AdminTagSelectorComponent implements OnInit, OnDestroy {
	@Input() tags: ATTag[] = [];
	private subscriptions: Subscription[] = [];

	public tagsSelectable: ATTag[] = [];
	public tagGroups: ATTagGroup[] = [];

	public colWidth = 12;

	constructor(
		private ds: DataStoreService
	) { }

	ngOnInit() {
		this.subscriptions.push( this.ds.store.tags.items.subscribe( this.handleTagRefresh ) );
		this.subscriptions.push( this.ds.store.taggroups.items.subscribe( this.handleTagGroupRefresh ) );
	}

	ngOnDestroy() {
		this.subscriptions.forEach( s => s.unsubscribe() );
		this.subscriptions = [];
	}

	private handleTagRefresh = ( sourceTags: ATTag[] ) => {
		this.tagsSelectable = sourceTags.sort( SortByName );
	}

	private handleTagGroupRefresh = ( sourceGroups: ATTagGroup[] ) => {
		this.tagGroups = sourceGroups.sort( SortByPosition );
		this.colWidth = this.decideColWidth( this.tagGroups.length );
	}

	public decideColWidth = ( numCols: number ) => {
		let targetWidth = 12;
		if ( numCols > 0 ) {
			targetWidth = Math.floor( targetWidth / numCols );
		}
		if ( targetWidth < 1 ) targetWidth = 1;
		return targetWidth;
	}

}
