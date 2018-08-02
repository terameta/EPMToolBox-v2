import { ATStoreClass } from './at.storeconcept';

export class ATTagGroupClass extends ATStoreClass<ATDirectoryServer> { }

export interface ATDirectoryServer {
	id: number,
	name: string,
	description: string,
	prefix: string,
	hostname: string,
	port: number,
	sslenabled: boolean,
	istrusted: boolean,
	basedn: string,
	userdn: string,
	password: string
}
