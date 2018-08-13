import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PromptComponent } from './prompt/prompt.component';
import { ConfirmComponent } from './confirm/confirm.component';
import { CentralStatusService } from './central-status.service';
import { NotificationAreaComponent } from './notification-area/notification-area.component';
import { NotificationToShowComponent } from './notification-to-show/notification-to-show.component';

@NgModule( {
	imports: [
		CommonModule,
		FormsModule
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
		NotificationToShowComponent
	], entryComponents: [
		ConfirmComponent,
		PromptComponent
	]
} )
export class CentralStatusModule { }
