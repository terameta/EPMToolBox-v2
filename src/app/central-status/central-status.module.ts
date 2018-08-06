import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PromptComponent } from './prompt/prompt.component';
import { ConfirmComponent } from './confirm/confirm.component';
import { CentralStatusService } from './central-status.service';

@NgModule( {
	imports: [
		CommonModule,
		FormsModule
	],
	providers: [
		CentralStatusService
	],
	declarations: [
		ConfirmComponent,
		PromptComponent
	], entryComponents: [
		ConfirmComponent,
		PromptComponent
	]
} )
export class CentralStatusModule { }
