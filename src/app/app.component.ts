import { Component } from '@angular/core';
import { CentralStatusService } from './central-status.service';

@Component( {
	selector: 'app-root',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.scss']
} )
export class AppComponent {
	constructor(
		public centralStatus: CentralStatusService
	) { }
}
