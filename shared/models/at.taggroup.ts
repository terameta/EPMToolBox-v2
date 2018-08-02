import { ATStoreClass } from './at.storeconcept';

export class ATTagGroupClass extends ATStoreClass<ATTagGroup> { }

export interface ATTagGroup {
	id: number,
	name: string,
	position: number,
	isReordered: boolean
}

