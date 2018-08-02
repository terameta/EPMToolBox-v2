import { ATStoreClass } from './at.storeconcept';

export class ATAsyncProcessClass extends ATStoreClass<ATAsyncProcess> { }

export interface ATAsyncProcess {
	id: number,
	name: string
}
