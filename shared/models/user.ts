export interface ATUser {
	id: number,
	name: string,
	surname: string,
	email: string,
	role: 'admin' | 'superuser' | 'user'
}

export const ATUserDefault: ATUser = { id: 0, name: '', surname: '', email: '', role: 'user' };
