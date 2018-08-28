import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { NgxMonacoEditorConfig } from 'ngx-monaco-editor';

@Component( {
	selector: 'app-coder',
	templateUrl: './coder.component.html',
	styleUrls: ['./coder.component.scss']
} )
export class CoderComponent implements OnInit, OnDestroy {
	@Input() code = '';
	@Input() options = {};
	@Input() name = 'currentCoder';

	public onClose: Subject<string>;

	private defaultOptions = {
		theme: 'vs-light',
		minimap: { enabled: false },
		fontSize: 12,
		fontFamily: 'consolas',
		scrollBeyondLastLine: false,
		// automaticLayout: true,
		overviewRulerBorder: false
	};

	constructor( public modalRef: BsModalRef ) { }

	ngOnInit() {
		this.onClose = new Subject();
		this.options = { ...this.defaultOptions, ...this.options };
	}

	ngOnDestroy() {
		this.cancel();
	}

	public save = () => {
		this.onClose.next( this.code );
		this.modalRef.hide();
		this.onClose.complete();
	}

	public cancel = () => {
		this.modalRef.hide();
		this.onClose.complete();
	}
}
