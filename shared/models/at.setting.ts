import { ATStoreClass } from './at.storeconcept';

export class ATSettingClass extends ATStoreClass<ATSetting> { }

export interface ATSetting {
	id: number,
	name: string,
	emailserver: {
		host: string,
		port: number,
		issecure: boolean,
		rejectunauthorized: boolean,
		user: string,
		pass: string
	},
	systemadmin: {
		emailaddress: string,
		fromname: string
	}
}
