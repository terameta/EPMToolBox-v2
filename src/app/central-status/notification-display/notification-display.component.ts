import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { ATNotification } from 'shared/models/notification';

@Component( {
	selector: 'app-notification-display',
	templateUrl: './notification-display.component.html',
	styleUrls: ['./notification-display.component.scss']
} )
export class NotificationDisplayComponent implements OnInit, OnDestroy {
	@Input() notification: ATNotification = <ATNotification>{};

	constructor() { }

	ngOnInit() {
	}

	ngOnDestroy() { }

}
