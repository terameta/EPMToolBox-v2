import { Component } from '@angular/core';
import { CommunicationService } from './communication/communication.service';

@Component( {
	selector: 'app-root',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.scss']
} )
export class AppComponent {
	constructor(
		private cs: CommunicationService
	) { }
}
