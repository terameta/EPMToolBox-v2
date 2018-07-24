export interface ATUser {
	id: number,
	name: string,
	surname: string,
	username: string,
	password?: string,
	role: 'admin' | 'superuser' | 'user'
	type: 'local' | 'directory',
	ldapserver: number,
	email: string,
	clearance: any
}

export const ATUserDefault: ATUser = { id: 0, name: '', surname: '', username: '', role: 'user', type: 'local', ldapserver: 0, email: '', clearance: {} };
