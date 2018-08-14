import { Component, OnInit, OnDestroy } from '@angular/core';
import { ATEnvironment, ATEnvironmentType, atGetEnvironmentTypeDescription } from 'shared/models/at.environment';
import { DataStoreService } from '../../../data-store/data-store.service';
import { Subscription } from 'rxjs';
import { CentralStatusService } from '../../../central-status/central-status.service';
import { EnvironmentsService } from '../environments.service';
import { AdminSharedService } from '../../admin-shared/admin-shared.service';

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
		public cs: CentralStatusService,
		public ss: AdminSharedService,
		public ms: EnvironmentsService
	) {
		this.subscriptions.push( this.ds.store.environments.items.subscribe( i => this.environments = i ) );
	}

	ngOnInit() { }

	ngOnDestroy() {
		this.subscriptions.forEach( s => s.unsubscribe() );
		this.subscriptions = [];
	}

}
