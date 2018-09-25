import { Injectable } from '@angular/core';
import { CommunicationService } from '../../communication/communication.service';
import { Router } from '@angular/router';
import { CentralStatusService } from '../../central-status/central-status.service';
import { JSONDeepCopy } from '../../../../shared/utilities/utilityFunctions';
import { NgForm } from '@angular/forms';

@Injectable( {
	providedIn: 'root'
} )
export class AdminSharedService {

	constructor(
		private cs: CommunicationService,
		private ss: CentralStatusService,
		private router: Router
	) { }

	public delete = async ( framework: string, id: number, name: string, shouldNavigate = true ) => {
		const shouldDelete = await this.ss.confirm( 'Do you really want to delete ' + ( name || id ) + '?' );
		if ( shouldDelete ) this.cs.communicate( { framework: framework, action: 'delete', payload: { status: 'request', data: id } }, true );
		if ( shouldNavigate ) this.router.navigateByUrl( '/admin/' + framework );
	}

	public update = async <T>( framework: string, payload: T, form?: NgForm ) => {
		this.cs.communicate( { framework, action: 'update', payload: { status: 'request', data: payload } }, true ).subscribe( () => {
			if ( form ) form.form.markAsPristine();
		} );
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

	public create = ( framework: string, payload?: any, shouldNavigate = false ) => {
		return new Promise( async ( resolve, reject ) => {
			const result = await this.ss.prompt( 'Please enter the name of the new item' );
			if ( !result ) return;
			const data = { ...payload, ...{ name: result } };
			this.cs.communicate( { framework, action: 'create', payload: { status: 'request', data } }, true ).
				subscribe( ( response ) => {
					if ( response.data && response.data.id && shouldNavigate ) {
						this.navigateTo( framework, response.data.id );
					}
					resolve( response.data );
				}, reject );
		} );

	}

	public navigateTo = ( framework: string, id: number ) => this.router.navigateByUrl( '/admin/' + framework + '/' + id );
	public navigateByUrl = ( url: string ) => this.router.navigateByUrl( url );
}
