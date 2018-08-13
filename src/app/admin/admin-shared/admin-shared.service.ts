import { Injectable } from '@angular/core';
import { CommunicationService } from '../../communication/communication.service';
import { Router } from '@angular/router';
import { CentralStatusService } from '../../central-status/central-status.service';
import { JSONDeepCopy } from '../../../../shared/utilities/utilityFunctions';

@Injectable( {
	providedIn: 'root'
} )
export class AdminSharedService {

	constructor(
		private cs: CommunicationService,
		private ss: CentralStatusService,
		private router: Router
	) { }

	public delete = async ( framework: string, id: number, name: string ) => {
		const shouldDelete = await this.ss.confirm( 'Do you really want to delete ' + ( name || id ) + '?' );
		if ( shouldDelete ) this.cs.communicate( { framework: framework, action: 'delete', payload: { status: 'request', data: id } } );
		this.router.navigateByUrl( '/admin/' + framework );
	}

	public update = async <T>( framework: string, payload: T ) => {
		this.cs.communicate( { framework, action: 'update', payload: { status: 'request', data: payload } } );
	}

	public clone = async <T>( framework: string, source ) => {
		const result = await this.ss.prompt( 'Please enter the name of the new item' );
		const payload: T = JSONDeepCopy( source );
		if ( !result ) return;
		( payload as any ).name = result.toString();
		delete ( payload as any ).id;
		delete ( payload as any ).verified;
		this.cs.communicate( { framework, action: 'create', payload: { status: 'request', data: payload } }, true ).subscribe( ( response ) => {
			if ( response.data && response.data.id ) {
				this.router.navigateByUrl( '/admin/' + framework + '/' + response.data.id );
			}
		} );
	}
}
