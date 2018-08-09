import { ATStoreClass } from './at.storeconcept';
import { JSONDeepCopy } from '../utilities/utilityFunctions';

export class ATCredentialClass extends ATStoreClass<ATCredential> { }

export interface ATCredential {
	id: number,
	name: string,
	username: string,
	password: string,
	tags: any,
	clearPassword?: string
}

export const getDefaultATCredential = () => ( <ATCredential>JSONDeepCopy( { tags: {} } ) );
