import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EndUserFrontPageComponent } from './end-user-front-page/end-user-front-page.component';
import { RouterModule } from '@angular/router';

const routes = [
	{ path: '', component: EndUserFrontPageComponent }
];

@NgModule( {
	imports: [
		CommonModule,
		RouterModule.forChild( routes )
	],
	declarations: [EndUserFrontPageComponent]
} )
export class EndUserModule { }
