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
