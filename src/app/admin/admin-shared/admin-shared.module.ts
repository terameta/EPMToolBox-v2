import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminToolbarComponent } from './admin-toolbar/admin-toolbar.component';
import { RouterModule } from '@angular/router';

@NgModule( {
	imports: [
		CommonModule,
		FormsModule,
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
