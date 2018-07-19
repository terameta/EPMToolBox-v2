export interface ATCredential {
	id: number,
	name: string,
	username: string,
	password: string,
	tags: any
}

export interface ATCredentialDetail extends ATCredential {
	clearPassword: string
}
