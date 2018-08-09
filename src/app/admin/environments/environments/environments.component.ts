import { Component, OnInit, OnDestroy } from '@angular/core';
import { ATEnvironment } from 'shared/models/at.environment';
import { Subscription } from 'rxjs';
import { DataStoreService } from '../../../data-store/data-store.service';

@Component( {
	selector: 'app-environments',
	templateUrl: './environments.component.html',
	styleUrls: ['./environments.component.scss']
} )
export class EnvironmentsComponent implements OnInit, OnDestroy {
	public environments: ATEnvironment[] = [];

	private subscriptions: Subscription[] = [];


	constructor( private ds: DataStoreService ) { }

	ngOnInit() {
		this.ds.showInterest( { concept: 'environments' } );
		this.subscriptions.push( this.ds.store.environments.items.subscribe( ( i ) => { this.environments = i; } ) );
	}

	ngOnDestroy() {
		// this.ds.looseInterest( { concept: 'environments' } );
		this.subscriptions.forEach( s => s.unsubscribe() );
	}

}
