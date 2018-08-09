import { Injectable } from '@angular/core';
import { CentralStatusService } from '../../central-status/central-status.service';
import { CommunicationService } from '../../communication/communication.service';
import { Router } from '@angular/router';
import { ATEnvironment } from 'shared/models/at.environment';
import { JSONDeepCopy } from 'shared/utilities/utilityFunctions';

@Injectable( {
	providedIn: 'root'
} )
export class EnvironmentsService {
	private framework = 'environments';

	constructor(
		private ss: CentralStatusService,
		private cs: CommunicationService,
		private router: Router
	) { }

	public delete = async ( id: number, name: string ) => {
		const shouldDelete = await this.ss.confirm( 'Do you really want to delete ' + ( name ? name : id ) + '?' );
		if ( shouldDelete ) this.cs.communicate( { framework: this.framework, action: 'delete', payload: { status: 'request', data: id } } );
		this.router.navigateByUrl( '/admin/' + this.framework );
	}

	public verify = ( id: number ) => {
		this.cs.communicate( { framework: this.framework, action: 'verify', payload: { status: 'request', data: id } } );
	}

	public update = ( payload: ATEnvironment ) => {
		this.cs.communicate( { framework: this.framework, action: 'update', payload: { status: 'request', data: payload } } );
	}

	public clone = async ( source: ATEnvironment ) => {
		const result = await this.ss.prompt( 'Please enter the name of the new item' );
		const payload: ATEnvironment = JSONDeepCopy( source );
		payload.verified = false;
		if ( !result ) return;
		payload.name = result.toString();
		delete payload.id;
		this.cs.communicate( { framework: this.framework, action: 'create', payload: { status: 'request', data: payload } }, true ).subscribe( ( response ) => {
			// console.log( response.data );
			if ( response.data && response.data.id ) {
				this.router.navigateByUrl( '/admin/' + this.framework + '/' + response.data.id );
			}
		} );
	}

}
