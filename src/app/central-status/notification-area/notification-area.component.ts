import { Component, OnInit } from '@angular/core';
import { CentralStatusService } from '../central-status.service';
import { ATNotification } from 'shared/models/notification';

@Component( {
	selector: 'app-notification-area',
	templateUrl: './notification-area.component.html',
	styleUrls: ['./notification-area.component.scss']
} )
export class NotificationAreaComponent implements OnInit {
	public notifications: ATNotification[] = [];

	constructor(
		public ss: CentralStatusService
	) { }

	ngOnInit() {
		this.ss.notifications$.subscribe( n => this.notifications = n );
	}

}
