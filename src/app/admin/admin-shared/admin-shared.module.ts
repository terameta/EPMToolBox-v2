import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminToolbarComponent } from './admin-toolbar/admin-toolbar.component';
import { RouterModule } from '@angular/router';
import { AdminTagSelectorComponent } from './admin-tag-selector/admin-tag-selector.component';

@NgModule( {
	imports: [
		CommonModule,
		FormsModule,
		RouterModule
	],
	declarations: [
		AdminToolbarComponent,
		AdminTagSelectorComponent
	],
	exports: [
		AdminToolbarComponent,
		AdminTagSelectorComponent
	]
} )
export class AdminSharedModule { }
