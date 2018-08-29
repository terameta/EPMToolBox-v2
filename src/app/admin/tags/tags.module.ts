import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TagsComponent } from './tags/tags.component';
import { TagListComponent } from './tag-list/tag-list.component';
import { TagGroupListComponent } from './tag-group-list/tag-group-list.component';
import { TagGroupDetailComponent } from './tag-group-detail/tag-group-detail.component';
import { Routes, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AdminSharedModule } from '../admin-shared/admin-shared.module';

const routes: Routes = [
	{
		path: '', component: TagsComponent, children: [
			{
				path: '', component: TagListComponent, children: [
					{ path: '', component: TagGroupListComponent },
					{ path: ':id', component: TagGroupDetailComponent }
				]
			}
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
		TagsComponent,
		TagListComponent,
		TagGroupListComponent,
		TagGroupDetailComponent
	]
} )
export class TagsModule { }
