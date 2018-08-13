import { Component, OnInit, Input } from '@angular/core';
import { ATNotification } from 'shared/models/notification';

@Component( {
	selector: 'app-notification-to-show',
	templateUrl: './notification-to-show.component.html',
	styleUrls: ['./notification-to-show.component.scss']
} )
export class NotificationToShowComponent implements OnInit {
	@Input() notification: ATNotification;

	constructor() { }

	ngOnInit() {
	}

}
