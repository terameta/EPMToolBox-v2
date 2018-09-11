import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PromptComponent } from './prompt/prompt.component';
import { ConfirmComponent } from './confirm/confirm.component';
import { CentralStatusService } from './central-status.service';
import { NotificationAreaComponent } from './notification-area/notification-area.component';
import { NotificationToShowComponent } from './notification-to-show/notification-to-show.component';
import { CoderComponent } from './coder/coder.component';
import { MonacoEditorModule } from 'ngx-monaco-editor';
import { NotificationDisplayComponent } from './notification-display/notification-display.component';

@NgModule( {
	imports: [
		CommonModule,
		FormsModule,
		MonacoEditorModule
	],
	exports: [
		NotificationAreaComponent
	],
	providers: [
		CentralStatusService
	],
	declarations: [
		ConfirmComponent,
		PromptComponent,
		NotificationAreaComponent,
		NotificationToShowComponent,
		CoderComponent,
		NotificationDisplayComponent
	], entryComponents: [
		CoderComponent,
		ConfirmComponent,
		PromptComponent,
		NotificationDisplayComponent
	]
} )
export class CentralStatusModule { }
