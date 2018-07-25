import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EndUserFrontPageComponent } from './end-user-front-page/end-user-front-page.component';
import { RouterModule } from '@angular/router';
import { EndUserComponent } from './end-user/end-user.component';

const routes = [
	{ path: '', component: EndUserFrontPageComponent }
];

@NgModule( {
	imports: [
		CommonModule,
		RouterModule.forChild( routes )
	],
	declarations: [EndUserFrontPageComponent, EndUserComponent]
} )
export class EndUserModule { }
