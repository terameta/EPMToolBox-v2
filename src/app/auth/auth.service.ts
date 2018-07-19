import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ATUser, ATUserDefault } from 'shared/models/at.user';
import { JSONDeepCopy } from 'shared/utilities/utilityFunctions';
import { HttpClient } from '@angular/common/http';
import { map, catchError } from 'rxjs/operators';
import { CentralStatusService } from '../central-status.service';

@Injectable( {
	providedIn: 'root'
} )
export class AuthService {
	isAuthenticated$ = new BehaviorSubject<boolean>( false );
	user$ = new BehaviorSubject<ATUser>( JSONDeepCopy( ATUserDefault ) );

	constructor(
		private http: HttpClient,
		private centralStatus: CentralStatusService
	) { }

	public signUserIn = ( username: string, password: string ) => {
		return this.http.post( '/api/auth/signin', { username, password } ).pipe(
			map( response => {
				console.log( response );
			} )
		);
	}

	public signUserUp = ( username: string ) => {
		return this.http.post( '/api/auth/signup', { username } ).pipe(
			map( response => {
				console.log( response );
			} )
		);
	}
}
