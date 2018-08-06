import { Component, OnInit, Input, OnDestroy, HostListener } from '@angular/core';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { Subject } from 'rxjs';

@Component( {
	selector: 'app-confirm',
	templateUrl: './confirm.component.html',
	styleUrls: ['./confirm.component.scss']
} )
export class ConfirmComponent implements OnInit, OnDestroy {
	@Input() question = 'Do you want to proceed?';

	public onClose: Subject<boolean>;

	@HostListener( 'window:keydown', ['$event'] ) handleKeyDown( event: KeyboardEvent ) {
		if ( event.key === 'Enter' ) {
			this.yes();
		}
	}

	constructor( public modalRef: BsModalRef ) { }

	ngOnInit() {
		this.onClose = new Subject();
	}

	ngOnDestroy() {
		this.no();
	}

	public yes = () => {
		this.onClose.next( true );
		this.modalRef.hide();
		this.onClose.complete();
	}

	public no = () => {
		this.onClose.next( false );
		this.modalRef.hide();
		this.onClose.complete();
	}

}
