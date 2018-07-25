import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

// ngx-bootstrap modules
import { CollapseModule } from 'ngx-bootstrap/collapse';

import { AppComponent } from './app.component';
import { Routes, RouterModule } from '@angular/router';
import { JwtModule } from '@auth0/angular-jwt';
import { SignInComponent } from './sign-in/sign-in.component';
import { SignUpComponent } from './sign-up/sign-up.component';
import { FrontPageComponent } from './front-page/front-page.component';
import { AuthModule } from './auth/auth.module';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { DataStoreModule } from './data-store/data-store.module';
import { AuthGuardService as AuthGuard } from './auth-guard.service';
import { AdminComponent } from './admin/admin/admin.component';


const routes: Routes = [
	{ path: '', canActivate: [AuthGuard], component: FrontPageComponent },
	{ path: 'signin', component: SignInComponent },
	{ path: 'signup', component: SignUpComponent },
	{ path: 'admin', canActivate: [AuthGuard], data: { expectedRole: 'admin' }, component: AdminComponent, loadChildren: './admin/admin.module#AdminModule' },
	{ path: 'enduser', canActivate: [AuthGuard], data: { expectedRole: 'user' }, loadChildren: './end-user/end-user.module#EndUserModule' },
	{ path: '**', redirectTo: '' }
];

export function tokenGetter() {
	return localStorage.getItem( 'token' );
}

@NgModule( {
	declarations: [
		AppComponent,
		SignInComponent,
		SignUpComponent,
		FrontPageComponent
	],
	imports: [
		BrowserModule,
		RouterModule.forRoot( routes ),
		FormsModule,
		HttpClientModule,
		JwtModule.forRoot( {
			config: {
				tokenGetter: tokenGetter
			}
		} ),
		AuthModule,
		DataStoreModule,
		CollapseModule.forRoot()
	],
	providers: [],
	bootstrap: [AppComponent]
} )
export class AppModule { }
