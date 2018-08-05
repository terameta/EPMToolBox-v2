import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';

import { EnvironmentsComponent } from './environments/environments.component';
import { EnvironmentDetailComponent } from './environment-detail/environment-detail.component';
import { AdminSharedModule } from '../admin-shared/admin-shared.module';
import { EnvironmentListComponent } from './environment-list/environment-list.component';

const routes: Routes = [
	{
		path: '', component: EnvironmentsComponent, children: [
			{ path: '', component: EnvironmentListComponent },
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
		EnvironmentDetailComponent,
		EnvironmentListComponent
	]
} )
export class EnvironmentsModule { }
