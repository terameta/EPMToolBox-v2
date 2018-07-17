import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminNavbarComponent } from './admin-navbar/admin-navbar.component';
import { AdminFrontPageComponent } from './admin-front-page/admin-front-page.component';
import { RouterModule } from '../../../node_modules/@angular/router';

const routes = [
	{ path: '', component: AdminFrontPageComponent }
];

@NgModule( {
	imports: [
		CommonModule,
		RouterModule.forChild( routes )
	],
	declarations: [
		AdminNavbarComponent,
		AdminFrontPageComponent
	]
} )
export class AdminModule { }
