import { Component, OnInit } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { NgForm } from '@angular/forms';

@Component( {
	selector: 'app-sign-up',
	templateUrl: './sign-up.component.html',
	styleUrls: ['./sign-up.component.scss']
} )
export class SignUpComponent implements OnInit {
	isSigningUp = false;

	constructor(
		private authService: AuthService
	) { }

	ngOnInit() {
	}

	public signUp = ( form: NgForm ) => {
		this.isSigningUp = true;
		const username = form.value.username;
		this.authService.signUserUp( username ).subscribe( ( result ) => {
			console.log( result );
		}, ( error ) => {
			console.error( error );
		} );
	}

}
