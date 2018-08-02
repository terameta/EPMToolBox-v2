import { ATStoreClass } from './at.storeconcept';

export class ATSecretClass extends ATStoreClass<ATSecret> { }

export interface ATSecret {
	id: number,
	name: string,
	whiteList: string[],
	secret: string
}
