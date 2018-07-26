import { Component, OnInit, OnDestroy } from '@angular/core';
import { DataStoreService } from '../../data-store/data-store.service';
import { take } from 'rxjs/operators';
import { Subscription, BehaviorSubject } from 'rxjs';

@Component( {
	selector: 'app-admin-front-page',
	templateUrl: './admin-front-page.component.html',
	styleUrls: ['./admin-front-page.component.scss']
} )
export class AdminFrontPageComponent implements OnInit, OnDestroy {
	public environments;
	public streams;

	constructor( public ds: DataStoreService ) { }

	ngOnInit() {
		this.ds.showInterest( { concept: 'environments' } ).subscribe( result => this.environments = result );
		this.ds.showInterest( { concept: 'streams' } ).subscribe( result => this.streams = result );

		setTimeout( () => {
			setInterval( () => {
				this.ds.looseInterest( { concept: 'streams' } );
			}, 10000 );
		}, 5000 );
		setInterval( () => {
			this.ds.showInterest( { concept: 'streams' } );
		}, 10000 );
	}

	ngOnDestroy() {
	}

}
