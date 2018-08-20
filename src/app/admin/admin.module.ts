import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminNavbarComponent } from './admin-navbar/admin-navbar.component';
import { AdminFrontPageComponent } from './admin-front-page/admin-front-page.component';
import { RouterModule, Routes } from '@angular/router';
import { CollapseModule } from 'ngx-bootstrap/collapse';
import { AdminComponent } from './admin/admin.component';
import { AdminSharedModule } from './admin-shared/admin-shared.module';

const routes: Routes = [
	{ path: '', component: AdminFrontPageComponent },
	{ path: 'environments', loadChildren: './environments/environments.module#EnvironmentsModule' },
	{ path: 'streams', loadChildren: './streams/streams.module#StreamsModule' },
	{ path: 'credentials', loadChildren: './credentials/credentials.module#CredentialsModule' }
];

@NgModule( {
	imports: [
		CommonModule,
		FormsModule,
		RouterModule.forChild( routes ),
		CollapseModule,
		AdminSharedModule
	],
	declarations: [
		AdminNavbarComponent,
		AdminFrontPageComponent,
		AdminComponent
	]
} )
export class AdminModule { }
