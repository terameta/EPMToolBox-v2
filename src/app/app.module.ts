import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

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

const routes: Routes = [
	{ path: '', component: FrontPageComponent },
	{ path: 'signin', component: SignInComponent },
	{ path: 'signup', component: SignUpComponent },
	{ path: 'admin', loadChildren: './admin/admin.module#AdminModule' },
	{ path: 'enduser', loadChildren: './end-user/end-user.module#EndUserModule' }
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
		NgbModule,
		RouterModule.forRoot( routes ),
		FormsModule,
		HttpClientModule,
		JwtModule.forRoot( {
			config: {
				tokenGetter: tokenGetter
			}
		} ),
		AuthModule,
		DataStoreModule
	],
	providers: [],
	bootstrap: [AppComponent]
} )
export class AppModule { }
