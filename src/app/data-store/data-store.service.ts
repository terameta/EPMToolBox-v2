import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ATDataStoreInterest } from 'shared/models/at.datastoreinterest';
import { ATEnvironmentConcept, ATEnvironmentConceptDefault } from 'shared/models/at.environment';
import { ATStreamConcept, ATStreamConceptDefault } from 'shared/models/at.stream';

@Injectable( {
	providedIn: 'root'
} )
export class DataStoreService {
	private store = {
		environments: new BehaviorSubject<ATEnvironmentConcept>( ATEnvironmentConceptDefault() ),
		streams: new BehaviorSubject<ATStreamConcept>( ATStreamConceptDefault() )
	};

	public interests$: BehaviorSubject<ATDataStoreInterest[]>;



	constructor() {
		this.interests$ = new BehaviorSubject( [] );
		// setInterval( () => {
		// 	console.log( 'Interest observer count:', this.interests$.observers.length, this.interests$.getValue() );
		// }, 1000 );
		console.log( 'Data store service prepare the looseInterest method' );
	}

	public showInterest = ( payload: ATDataStoreInterest ): BehaviorSubject<any> => {
		const currentInterests = this.interests$.getValue();
		const toCompare = this.interestToString( payload );
		if ( !currentInterests.map( this.interestToString ).includes( toCompare ) ) {
			currentInterests.push( JSON.parse( toCompare ) );
			this.interests$.next( currentInterests );
		}
		return this.store[payload.concept];
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
