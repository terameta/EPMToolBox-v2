export interface ATSetting {
	id: number,
	name: string,
	host?: string,
	port?: number,
	issecure?: boolean,
	rejectunauthorized?: boolean,
	user?: string,
	pass?: string,
	emailaddress?: string,
	fromname?: string
}

export interface ATSettingOnDB {
	id: number,
	name: string,
	value: any
}

export interface ATSettingObject {
	[key: string]: ATSetting
}
