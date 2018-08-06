import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { Subject } from 'rxjs';

@Component( {
	selector: 'app-prompt',
	templateUrl: './prompt.component.html',
	styleUrls: ['./prompt.component.scss']
} )
export class PromptComponent implements OnInit, OnDestroy {
	@Input() question = 'Please respond';
	public result = '';

	constructor( public modalRef: BsModalRef ) { }

	public onClose: Subject<any>;

	ngOnInit() {
		this.onClose = new Subject();
	}

	ngOnDestroy() {
		this.cancel();
	}

	public ok = () => {
		this.onClose.next( this.result );
		this.modalRef.hide();
		this.onClose.complete();
	}

	public cancel = () => {
		this.onClose.next( false );
		this.modalRef.hide();
		this.onClose.complete();
	}

}
