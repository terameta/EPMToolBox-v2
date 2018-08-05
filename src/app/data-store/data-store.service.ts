import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ATDataStoreInterest } from 'shared/models/at.datastoreinterest';
import { ATEnvironmentClass } from 'shared/models/at.environment';
import { ATStreamClass } from 'shared/models/at.stream';
import { ATApiCommunication } from 'shared/models/at.socketrequest';
import { ATMapClass } from 'shared/models/at.map';
import { ATMatrixClass } from 'shared/models/at.matrix';
import { ATScheduleClass } from 'shared/models/at.schedule';
import { ATProcessClass } from 'shared/models/at.process';
import { ATAsyncProcessClass } from 'shared/models/at.asyncprocess';
import { ATSettingClass } from 'shared/models/at.setting';
import { ATSecretClass } from 'shared/models/at.secret';
import { ATCredentialClass } from 'shared/models/at.credential';
import { ATTagClass } from 'shared/models/at.tag';
import { ATTagGroupClass } from 'shared/models/at.taggroup';
import { ATUserClass } from 'shared/models/at.user';
import { ATLogClass } from 'shared/models/at.log';

@Injectable( {
	providedIn: 'root'
} )
export class DataStoreService {
	public store = {
		environments: new ATEnvironmentClass(),
		streams: new ATStreamClass(),
		maps: new ATMapClass(),
		matrices: new ATMatrixClass(),
		schedules: new ATScheduleClass(),
		processes: new ATProcessClass(),
		asyncprocesses: new ATAsyncProcessClass(),
		settings: new ATSettingClass(),
		secrets: new ATSecretClass(),
		credentials: new ATCredentialClass(),
		tags: new ATTagClass(),
		taggroups: new ATTagGroupClass(),
		users: new ATUserClass(),
		logs: new ATLogClass()
	};

	public interests$: BehaviorSubject<ATDataStoreInterest[]>;



	constructor() {
		console.log( 'Constructed data-store.service' );
		this.interests$ = new BehaviorSubject( [] );
		// setInterval( () => {
		// 	console.log( 'Interest observer count:', this.interests$.observers.length, this.interests$.getValue() );
		// }, 5000 );
	}

	public react = ( response: ATApiCommunication ) => {
		if ( response.payload.status === 'success' ) this.store[response.framework][response.action]( response.payload.data );
	}

	public showInterest = ( payload: ATDataStoreInterest ) => {
		const currentInterests = this.interests$.getValue();
		const toCompare = this.interestToString( payload );
		if ( !currentInterests.map( this.interestToString ).includes( toCompare ) ) {
			currentInterests.push( JSON.parse( toCompare ) );
			this.interests$.next( currentInterests );
		}
	}

	public looseInterest = ( payload: ATDataStoreInterest ) => {
		const currentInterests = this.interests$.getValue();
		const filteredInterests = currentInterests.filter( interest => this.interestToString( interest ) !== this.interestToString( payload ) );
		this.interests$.next( filteredInterests );
	}

	private interestToString = ( interest: ATDataStoreInterest ) => {
		return JSON.stringify( { concept: interest.concept, id: interest.id || interest.id === 0 ? interest.id : undefined } );
	}


}
