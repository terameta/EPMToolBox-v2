import { ATStoreClass } from './at.storeconcept';

export class ATUserClass extends ATStoreClass<ATUser> { }

export interface ATUser {
	id: number,
	name: string,
	surname: string,
	username: string,
	password?: string,
	role: 'admin' | 'superuser' | 'user' | 'notsignedin'
	type: 'local' | 'directory',
	ldapserver: number,
	email: string,
	clearance: any
}

export const ATUserDefault: ATUser = { id: 0, name: '', surname: '', username: '', role: 'notsignedin', type: 'local', ldapserver: 0, email: '', clearance: {} };
