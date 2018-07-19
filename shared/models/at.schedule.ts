import { ATCronStructure } from './at.cronstructure';
import { ATStatusType } from '../enums/statustypes';

export interface ATSchedule {
	id: number,
	name: string,
	steps: ATScheduleStep[],
	schedule: ATCronStructure[],
	status: ATStatusType,
	tags: any
}

export interface ATScheduleObject {
	[key: number]: ATSchedule
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
