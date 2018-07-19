export interface ATEnvironment {
	id: number,
	name: string,
	type: number,
	server: string,
	port: string,
	verified: number,
	identitydomain: string,
	credential: number,
	tags: any,
	SID: string,
	ssotoken: string
}

export interface ATEnvironmentDetail extends ATEnvironment {
	database: string,
	table: string,
	connection: any,
	query: string,
	procedure: string,
	username: string,
	password: string
}
