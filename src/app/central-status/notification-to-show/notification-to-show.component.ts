import { Component, OnInit, Input } from '@angular/core';
import { ATNotification } from 'shared/models/notification';
import { CentralStatusService } from '../central-status.service';

@Component( {
	selector: 'app-notification-to-show',
	templateUrl: './notification-to-show.component.html',
	styleUrls: ['./notification-to-show.component.scss']
} )
export class NotificationToShowComponent implements OnInit {
	@Input() notification: ATNotification;

	constructor(
		public cs: CentralStatusService
	) { }

	ngOnInit() {
	}

}
