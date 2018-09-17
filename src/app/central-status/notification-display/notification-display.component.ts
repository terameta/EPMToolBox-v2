import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { ATNotification } from 'shared/models/notification';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { Subject } from 'rxjs';

@Component( {
	selector: 'app-notification-display',
	templateUrl: './notification-display.component.html',
	styleUrls: ['./notification-display.component.scss']
} )
export class NotificationDisplayComponent implements OnInit, OnDestroy {
	@Input() notification: ATNotification = <ATNotification>{};

	public onClose: Subject<any>;

	constructor( public modalRef: BsModalRef ) { }

	ngOnInit() { this.onClose = new Subject(); }

	ngOnDestroy() { this.cancel(); }

	public dismiss = () => {
		this.onClose.next( 'dismissed' );
		this.modalRef.hide();
		this.onClose.complete();
	}

	public cancel = () => {
		this.onClose.next( false );
		this.modalRef.hide();
		this.onClose.complete();
	}

}
