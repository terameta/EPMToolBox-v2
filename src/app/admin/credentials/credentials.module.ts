import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CredentialsComponent } from './credentials/credentials.component';
import { CredentialListComponent } from './credential-list/credential-list.component';
import { CredentialDetailComponent } from './credential-detail/credential-detail.component';
import { Routes, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AdminSharedModule } from '../admin-shared/admin-shared.module';

const routes: Routes = [
	{
		path: '', component: CredentialsComponent, children: [
			{ path: '', component: CredentialListComponent },
			{ path: ':id', component: CredentialDetailComponent }
		]
	}
];

@NgModule( {
	imports: [
		CommonModule,
		FormsModule,
		RouterModule.forChild( routes ),
		AdminSharedModule
	],
	declarations: [
		CredentialsComponent,
		CredentialListComponent,
		CredentialDetailComponent]
} )
export class CredentialsModule { }
