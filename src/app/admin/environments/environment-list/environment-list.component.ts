import { Component, OnInit, OnDestroy } from '@angular/core';
import { ATEnvironment, ATEnvironmentType, atGetEnvironmentTypeDescription } from 'shared/models/at.environment';
import { DataStoreService } from '../../../data-store/data-store.service';
import { Subscription } from 'rxjs';
import { CommunicationService } from '../../../communication/communication.service';
import { CentralStatusService } from '../../../central-status/central-status.service';
import { EnvironmentsService } from '../environments.service';

@Component( {
	selector: 'app-environment-list',
	templateUrl: './environment-list.component.html',
	styleUrls: ['./environment-list.component.scss']
} )
export class EnvironmentListComponent implements OnInit, OnDestroy {
	public environments: ATEnvironment[] = [];
	public environmentTypes = ATEnvironmentType;
	public getEnvironmentTypeDescripton = atGetEnvironmentTypeDescription;

	private subscriptions: Subscription[] = [];

	constructor(
		private ds: DataStoreService,
		private cs: CommunicationService,
		public ss: CentralStatusService,
		public ms: EnvironmentsService
	) {
		this.ds.showInterest( { concept: 'environments' } );
		this.subscriptions.push( this.ds.store.environments.items.subscribe( i => this.environments = i ) );
	}

	ngOnInit() { }

	ngOnDestroy() {
		this.subscriptions.forEach( s => s.unsubscribe() );
		this.subscriptions = [];
	}

}
