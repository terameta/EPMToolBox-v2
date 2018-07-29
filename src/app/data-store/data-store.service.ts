import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ATDataStoreInterest } from 'shared/models/at.datastoreinterest';
import { ATEnvironmentConcept, ATEnvironmentConceptDefault } from 'shared/models/at.environment';
import { ATStreamConcept, ATStreamConceptDefault } from 'shared/models/at.stream';
import { ATApiCommunication } from 'shared/models/at.socketrequest';
import * as _ from 'lodash';
import { SortByName } from 'shared/utilities/utilityFunctions';
import { ATMapConcept, ATMapConceptDefault } from 'shared/models/at.map';
import { ATTagConcept, ATTagConceptDefault } from 'shared/models/at.tag';
import { ATTagGroupConcept, ATTagGroupConceptDefault } from 'shared/models/at.taggroup';

@Injectable( {
	providedIn: 'root'
} )
export class DataStoreService {
	private store = {
		environments: new BehaviorSubject<ATEnvironmentConcept>( ATEnvironmentConceptDefault() ),
		streams: new BehaviorSubject<ATStreamConcept>( ATStreamConceptDefault() ),
		maps: new BehaviorSubject<ATMapConcept>( ATMapConceptDefault() ),
		tags: new BehaviorSubject<ATTagConcept>( ATTagConceptDefault() ),
		taggroups: new BehaviorSubject<ATTagGroupConcept>( ATTagGroupConceptDefault() )
	};

	public interests$: BehaviorSubject<ATDataStoreInterest[]>;



	constructor() {
		this.interests$ = new BehaviorSubject( [] );
		// setInterval( () => {
		// 	console.log( 'Interest observer count:', this.interests$.observers.length, this.interests$.getValue() );
		// }, 1000 );
		console.log( 'Data store service prepare the looseInterest method' );
	}

	public react = ( response: ATApiCommunication ) => {
		if ( response.action === 'refresh' ) {
			const newData: ATEnvironmentConcept = ATEnvironmentConceptDefault();
			newData.subject = _.keyBy( response.payload.data, 'id' );
			newData.ids = response.payload.data.sort( SortByName ).map( tuple => tuple.id );
			this.store[response.framework].next( newData );
		}

	}

	public showInterest = <T>( payload: ATDataStoreInterest ): BehaviorSubject<T> => {
		const currentInterests = this.interests$.getValue();
		const toCompare = this.interestToString( payload );
		if ( !currentInterests.map( this.interestToString ).includes( toCompare ) ) {
			currentInterests.push( JSON.parse( toCompare ) );
			this.interests$.next( currentInterests );
		}
		return ( ( ( this.store[payload.concept] ) as any ) as BehaviorSubject<T> );
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
