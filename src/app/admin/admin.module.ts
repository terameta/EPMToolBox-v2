import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminNavbarComponent } from './admin-navbar/admin-navbar.component';
import { AdminFrontPageComponent } from './admin-front-page/admin-front-page.component';
import { RouterModule } from '@angular/router';
import { CollapseModule } from '../../../node_modules/ngx-bootstrap/collapse';
import { AdminComponent } from './admin/admin.component';

const routes = [
	{ path: '', component: AdminFrontPageComponent }
];

@NgModule( {
	imports: [
		CommonModule,
		RouterModule.forChild( routes ),
		CollapseModule
	],
	declarations: [
		AdminNavbarComponent,
		AdminFrontPageComponent,
		AdminComponent
	]
} )
export class AdminModule { }
