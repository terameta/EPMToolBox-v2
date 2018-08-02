import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';

import { EnvironmentsComponent } from './environments/environments.component';
import { EnvironmentsToolbarComponent } from './environments-toolbar/environments-toolbar.component';
import { EnvironmentDetailComponent } from './environment-detail/environment-detail.component';
import { AdminSharedModule } from '../admin-shared/admin-shared.module';

const routes: Routes = [
	{
		path: '', component: EnvironmentsComponent, children: [
			{ path: ':id', component: EnvironmentDetailComponent }
		]
	},

];


@NgModule( {
	imports: [
		CommonModule,
		FormsModule,
		RouterModule.forChild( routes ),
		AdminSharedModule
	],
	declarations: [
		EnvironmentsComponent,
		EnvironmentsToolbarComponent,
		EnvironmentDetailComponent
	]
} )
export class EnvironmentsModule { }
