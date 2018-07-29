import { Component, OnInit, OnDestroy } from '@angular/core';
import { DataStoreService } from '../../data-store/data-store.service';
import { ATEnvironmentConcept } from '../../../../shared/models/at.environment';
import { ATStreamConcept } from '../../../../shared/models/at.stream';
import { ATMapConcept } from '../../../../shared/models/at.map';
import { Subscription } from 'rxjs';

@Component( {
	selector: 'app-admin-front-page',
	templateUrl: './admin-front-page.component.html',
	styleUrls: ['./admin-front-page.component.scss']
} )
export class AdminFrontPageComponent implements OnInit, OnDestroy {
	public environments: ATEnvironmentConcept;
	public verifiedEnvironments = 0;
	public streams: ATStreamConcept;
	public maps: ATMapConcept;

	private subscriptions: Subscription[] = [];

	constructor( public ds: DataStoreService ) { }

	ngOnInit() {
		this.subscriptions.push(
			this.ds.showInterest<ATEnvironmentConcept>( { concept: 'environments' } ).subscribe( result => {
				this.environments = result;
				this.verifiedEnvironments = this.environments.ids.map( id => this.environments.subject[id] ).filter( e => e.verified > 0 ).length;
			} )
		);
		this.subscriptions.push( this.ds.showInterest<ATStreamConcept>( { concept: 'streams' } ).subscribe( result => this.streams = result ) );
		this.subscriptions.push( this.ds.showInterest<ATMapConcept>( { concept: 'maps' } ).subscribe( result => this.maps = result ) );
	}

	ngOnDestroy() {
		this.subscriptions.forEach( s => s.unsubscribe() );
		this.ds.looseInterest( { concept: 'environments' } );
		this.ds.looseInterest( { concept: 'streams' } );
		this.ds.looseInterest( { concept: 'maps' } );
	}

}
