import { ATCronStructure } from './at.cronstructure';
import { ATStatusType } from '../enums/statustypes';
import { ATStoreClass } from './at.storeconcept';

export class ATScheduleClass extends ATStoreClass<ATSchedule> { }

export interface ATSchedule {
	id: number,
	name: string,
	steps: ATScheduleStep[],
	schedule: ATCronStructure[],
	status: ATStatusType,
	tags: any
}

export interface ATScheduleStep {
	type: ATScheduleStepType,
	referedid: number,
	position: number
}

export enum ATScheduleStepType {
	Process = 1,
	AsyncBR = 2,
	BackUp = 3
}
