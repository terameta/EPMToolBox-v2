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
	public framework = 'environments';

	constructor(
		private ss: CentralStatusService,
		private cs: CommunicationService,
		private router: Router
	) { }

	public verify = ( id: number ) => {
		return new Promise( ( resolve, reject ) => {
			this.cs.communicate( { framework: this.framework, action: 'verify', payload: { status: 'request', data: id } }, true ).subscribe( resolve, reject );
		} );
	}

	public listDatabases = ( id: number ) => this.cs.communicate( { framework: this.framework, action: 'listDatabases', payload: { status: 'request', data: id } }, true );
	public listTables = ( id: number, database: string ) => this.cs.communicate( { framework: this.framework, action: 'listTables', payload: { status: 'request', data: { id, database } } }, true );
	public listFields = ( id: number, database: string, table: string, query: string ) => this.cs.communicate( { framework: this.framework, action: 'listFields', payload: { status: 'request', data: { id, database, table, query } } }, true );
	public listDescriptiveTables = ( id: number, database: string, table: string ) => this.cs.communicate( { framework: this.framework, action: 'listDescriptiveTables', payload: { status: 'request', data: { id, database, table } } }, true );
}
