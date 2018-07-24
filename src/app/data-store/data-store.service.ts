import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable( {
	providedIn: 'root'
} )
export class DataStoreService {
	public dataStore: BehaviorSubject<any>;

	constructor() {
		console.log( 'Data store service initiated' );
	}

	public table = ( tableName: string, where?: string[], orderBy?: string[] ) => {

	}

	public tuple = ( tableName: string, id: number ) => {

	}
}
