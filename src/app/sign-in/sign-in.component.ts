import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { AuthService } from '../auth/auth.service';

@Component( {
	selector: 'app-sign-in',
	templateUrl: './sign-in.component.html',
	styleUrls: ['./sign-in.component.scss']
} )
export class SignInComponent implements OnInit {
	isSigningIn = false;

	constructor(
		private authService: AuthService
	) { }

	ngOnInit() {
	}

	public signIn = ( form: NgForm ) => {
		this.isSigningIn = true;
		const username = form.value.username;
		const password = form.value.password;
		this.authService.signUserIn( username, password ).subscribe( ( result ) => {
			console.log( result );
		}, ( error ) => {
			console.error( error );
		} );
	}

}
