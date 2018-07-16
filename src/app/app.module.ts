import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

import { AppComponent } from './app.component';
import { NavbarComponent } from './navbar/navbar.component';
import { Routes, RouterModule } from '../../node_modules/@angular/router';

const routes: Routes = [];

@NgModule( {
	declarations: [
		AppComponent,
		NavbarComponent
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
