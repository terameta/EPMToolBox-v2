import { ATStoreClass } from './at.storeconcept';

export class ATTagClass extends ATStoreClass<ATTag> { }

export interface ATTag {
	id: number,
	name: string,
	description: string,
	taggroup: number
}
