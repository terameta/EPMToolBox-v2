import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EnvironmentsComponent } from './environments/environments.component';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
	{ path: '', component: EnvironmentsComponent }
];


@NgModule( {
	imports: [
		CommonModule,
		RouterModule.forChild( routes )
	],
	declarations: [EnvironmentsComponent]
} )
export class EnvironmentsModule { }
