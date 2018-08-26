import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';

import { AdminSharedModule } from '../admin-shared/admin-shared.module';

import { StreamsComponent } from './streams/streams.component';
import { StreamListComponent } from './stream-list/stream-list.component';
import { StreamDetailComponent } from './stream-detail/stream-detail.component';
import { StreamDetailDefinitionsComponent } from './stream-detail-definitions/stream-detail-definitions.component';
import { StreamDetailFieldsComponent } from './stream-detail-fields/stream-detail-fields.component';
import { StreamDetailFielddescriptionsComponent } from './stream-detail-fielddescriptions/stream-detail-fielddescriptions.component';
import { StreamDetailExportsComponent } from './stream-detail-exports/stream-detail-exports.component';
import { MonacoEditorModule } from 'ngx-monaco-editor';
import { StreamDetailFieldsRdbtComponent } from './stream-detail-fields-rdbt/stream-detail-fields-rdbt.component';
import { StreamDetailFieldsHpdbComponent } from './stream-detail-fields-hpdb/stream-detail-fields-hpdb.component';
import { StreamDetailFielddescriptionsHpdbComponent } from './stream-detail-fielddescriptions-hpdb/stream-detail-fielddescriptions-hpdb.component';
import { StreamDetailFielddescriptionsRdbtComponent } from './stream-detail-fielddescriptions-rdbt/stream-detail-fielddescriptions-rdbt.component';
import { StreamDetailFielddescriptionsSelectorComponent } from './stream-detail-fielddescriptions-selector/stream-detail-fielddescriptions-selector.component';

const routes: Routes = [
	{
		path: '', component: StreamsComponent, children: [
			{ path: '', component: StreamListComponent },
			{
				path: ':id', component: StreamDetailComponent, children: [
					{ path: '', redirectTo: 'definitions', pathMatch: 'prefix' },
					{ path: 'definitions', component: StreamDetailDefinitionsComponent },
					{ path: 'fields', component: StreamDetailFieldsComponent },
					{
						path: 'fielddescriptions', component: StreamDetailFielddescriptionsComponent, children: [
							{ path: ':name', component: StreamDetailFielddescriptionsSelectorComponent }
						]
					},
					{ path: 'exports', component: StreamDetailExportsComponent }
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
		AdminSharedModule,
		MonacoEditorModule
	],
	declarations: [
		StreamsComponent,
		StreamListComponent,
		StreamDetailComponent,
		StreamDetailDefinitionsComponent,
		StreamDetailFieldsComponent,
		StreamDetailFielddescriptionsComponent,
		StreamDetailExportsComponent,
		StreamDetailFieldsRdbtComponent,
		StreamDetailFieldsHpdbComponent,
		StreamDetailFielddescriptionsHpdbComponent,
		StreamDetailFielddescriptionsRdbtComponent,
		StreamDetailFielddescriptionsSelectorComponent
	]
} )
export class StreamsModule { }
