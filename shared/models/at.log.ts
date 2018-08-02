import { ATStoreClass } from './at.storeconcept';

export class ATLogClass extends ATStoreClass<ATLog> { }

export interface ATLog {
	id: number,
	name: string,
	parent: number,
	start: Date,
	end: Date,
	details: string,
	refid: number,
	reftype: string
}

export interface ATLogSubject {
	[key: number]: ATLog
}

export interface ATLogConcept {
	subject: ATLogSubject,
	ids: number[]
}

export const ATLogConceptDefault = (): ATLogConcept => ( { subject: {}, ids: [] } );
