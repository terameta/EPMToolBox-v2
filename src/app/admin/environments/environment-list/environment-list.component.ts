import { Component, OnInit, OnDestroy } from '@angular/core';
import { ATEnvironment } from 'shared/models/at.environment';
import { DataStoreService } from '../../../data-store/data-store.service';
import { Subscription, BehaviorSubject } from 'rxjs';
import { ATEnvironmentType, atGetEnvironmentTypeDescription } from 'shared/enums/environmenttypes';
import { CommunicationService } from '../../../communication/communication.service';
import { CentralStatusService } from '../../../central-status.service';

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
		public ss: CentralStatusService
	) {
		this.ds.showInterest( { concept: 'environments' } );
		this.subscriptions.push( this.ds.store.environments.items.subscribe( i => this.environments = i ) );
	}

	ngOnInit() { }

	ngOnDestroy() {
		this.subscriptions.forEach( s => s.unsubscribe() );
	}

	public shoulListItem = ( id: number ) => {
		return true;
	}

	public delete = ( id: number, name: string ) => {

	}

}
