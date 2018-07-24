import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { AuthService } from '../auth/auth.service';
import { CommunicationService } from '../communication/communication.service';

@Component( {
	selector: 'app-sign-in',
	templateUrl: './sign-in.component.html',
	styleUrls: ['./sign-in.component.scss']
} )
export class SignInComponent implements OnInit {
	isSigningIn = false;

	constructor( public authService: AuthService ) { }

	ngOnInit() { }

	public signIn = ( form: NgForm ) => {
		this.isSigningIn = true;
		const username = form.value.username;
		const password = form.value.password;
		this.authService.signUserInInitiate( username, password );
	}

}
