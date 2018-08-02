import { ATStoreClass } from './at.storeconcept';

export class ATCredentialClass extends ATStoreClass<ATCredential> { }

export interface ATCredential {
	id: number,
	name: string,
	username: string,
	password: string,
	tags: any,
	clearPassword?: string
}
