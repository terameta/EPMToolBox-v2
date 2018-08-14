import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
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

	public subscribables: any = {};

	public interests$: BehaviorSubject<ATDataStoreInterest[]> = new BehaviorSubject( [] );



	constructor() {
		this.prepareSubscribables();
		setInterval( this.checkSubscriptions, 300 );
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
		if ( currentInterests.length !== filteredInterests.length ) this.interests$.next( filteredInterests );
	}

	private interestToString = ( interest: ATDataStoreInterest ) => {
		return JSON.stringify( { concept: interest.concept, id: interest.id || interest.id === 0 ? interest.id : undefined } );
	}

	private prepareSubscribables = () => {
		Object.keys( this.store ).forEach( conceptKey => {
			this.subscribables[conceptKey] = {};

		} );
	}

	private checkSubscriptions = () => {
		Object.keys( this.store ).forEach( ck => {
			const ckCount = Object.values( this.store[ck] ).
				filter( sk => typeof sk === 'object' ).
				filter( sk => sk.constructor.name.indexOf( 'Subject' ) >= 0 ).
				reduce( ( acc: number, currentSubject: Subject<any> ) => acc + currentSubject.observers.length, 0 );
			this.subscribables[ck] = ckCount;
		} );
		Object.keys( this.subscribables ).forEach( ck => {
			if ( this.subscribables[ck] > 0 ) {
				this.showInterest( <ATDataStoreInterest>( { concept: ck } ) );
			} else {
				this.looseInterest( <ATDataStoreInterest>( { concept: ck } ) );
			}
		} );
	}
}
