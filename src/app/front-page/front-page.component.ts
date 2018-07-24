import { Component, OnInit } from '@angular/core';
import { DataStoreService } from '../data-store/data-store.service';

@Component( {
	selector: 'app-front-page',
	templateUrl: './front-page.component.html',
	styleUrls: ['./front-page.component.scss']
} )
export class FrontPageComponent implements OnInit {

	constructor(
		private ds: DataStoreService
	) { }

	ngOnInit() {
	}

}
