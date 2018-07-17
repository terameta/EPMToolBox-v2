import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ATUser, ATUserDefault } from 'shared/models/user';
import { JSONDeepCopy } from 'shared/utilities/utilityFunctions';
import { HttpClient } from '@angular/common/http';
import { map, catchError } from 'rxjs/operators';

@Injectable( {
	providedIn: 'root'
} )
export class AuthService {
	authenticated$ = new BehaviorSubject<boolean>( false );
	user$ = new BehaviorSubject<ATUser>( JSONDeepCopy( ATUserDefault ) );

	constructor(
		private http: HttpClient
	) { }

	// public signinUser = ( username: string, password: string ) => {
	// 	return this.http.post( '/api/auth/signin', { username, password } ).pipe(
	// 		map(),
	// 		catchError()
	// 	);
	// }
}
