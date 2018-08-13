import { Injectable } from '@angular/core';
import { AuthService } from './auth/auth.service';
import { CanActivate, Router, ActivatedRouteSnapshot } from '@angular/router';
import { JwtHelperService as JwtHelper } from '@auth0/angular-jwt';
import { CentralStatusService } from './central-status/central-status.service';

@Injectable( {
	providedIn: 'root'
} )
export class AuthGuardService implements CanActivate {

	constructor(
		private auth: AuthService,
		private router: Router,
		private jwtHelper: JwtHelper,
		private cs: CentralStatusService
	) { }

	public canActivate( route: ActivatedRouteSnapshot ): boolean {
		if ( !this.auth.isAuthenticated$.getValue() ) {
			this.router.navigate( ['signin'] );
			return false;
		}
		if ( route.data.expectedRole && route.data.expectedRole !== this.jwtHelper.decodeToken().role ) {
			this.cs.notificationAdd( { id: '', title: 'Unauthorized access detected!', type: 'error', shouldBlockUI: true, detail: 'You have tried to access a part of the system you are not authorized.' } );
			return false;
		}
		return true;
	}
}
