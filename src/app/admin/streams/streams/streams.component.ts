import { Component, OnInit, OnDestroy } from '@angular/core';
import { ATStream } from '../../../../../shared/models/at.stream';
import { Subscription } from 'rxjs';
import { DataStoreService } from '../../../data-store/data-store.service';

@Component( {
	selector: 'app-streams',
	templateUrl: './streams.component.html',
	styleUrls: ['./streams.component.scss']
} )
export class StreamsComponent implements OnInit, OnDestroy {
	public streams: ATStream[] = [];

	private subscriptions: Subscription[] = [];

	constructor( private ds: DataStoreService ) { }

	ngOnInit() {
		this.subscriptions.push( this.ds.store.streams.items.subscribe( i => this.streams = i ) );
	}

	ngOnDestroy() {
		this.subscriptions.forEach( s => s.unsubscribe() );
	}

}
