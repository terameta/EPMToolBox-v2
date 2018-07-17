import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

import { AppComponent } from './app.component';
import { Routes, RouterModule } from '../../node_modules/@angular/router';
import { SignInComponent } from './sign-in/sign-in.component';
import { SignUpComponent } from './sign-up/sign-up.component';
import { FrontPageComponent } from './front-page/front-page.component';

const routes: Routes = [
	{ path: '', component: FrontPageComponent },
	{ path: 'signin', component: SignInComponent },
	{ path: 'signup', component: SignUpComponent },
	{ path: 'admin', loadChildren: './admin/admin.module#AdminModule' },
	{ path: 'enduser', loadChildren: './end-user/end-user.module#EndUserModule' }
];

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
		RouterModule.forRoot( routes )
	],
	providers: [],
	bootstrap: [AppComponent]
} )
export class AppModule { }
