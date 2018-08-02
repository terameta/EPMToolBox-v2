import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminToolbarComponent } from './admin-toolbar/admin-toolbar.component';
import { RouterModule } from '@angular/router';

@NgModule( {
	imports: [
		CommonModule,
		RouterModule
	],
	declarations: [
		AdminToolbarComponent
	],
	exports: [
		AdminToolbarComponent
	]
} )
export class AdminSharedModule { }
