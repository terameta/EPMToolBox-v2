import { DB } from './tools.db';
import { MainTools } from './tools.main';
import { ATDirectoryServer } from 'shared/models/at.directoryserver';

export class ATDirectoryServerTool {
	private protectedPassword = '|||---protected---|||';

	constructor(
		private db: DB,
		private tools: MainTools
	) { }

	public getAll = async () => {
		const { tuples: servers } = await this.db.query<ATDirectoryServer>( 'SELECT * FROM acmservers' );
		servers.forEach( server => server.password = this.protectedPassword );
		return servers;
	}
	public getServerDetails = async ( id: number, shouldShowPassword = false ) => {
		const { tuples: servers } = await this.db.query<ATDirectoryServer>( 'SELECT * FROM acmservers WHERE id = ?', id );
		const server = servers[0];
		if ( servers.length !== 1 ) throw new Error( 'Wrong number of records' );
		if ( shouldShowPassword ) {
			server.password = this.tools.decryptText( server.password );
		} else {
			server.password = this.protectedPassword;
		}
		return server;
	}
	public getOne = ( id: number ) => this.getServerDetails( id );
	public update = async ( payload: ATDirectoryServer ) => {
		if ( payload.password === this.protectedPassword ) {
			delete payload.password;
		} else {
			payload.password = this.tools.encryptText( payload.password );
		}
		await this.db.query( 'UPDATE acmservers SET ? WHERE id = ?', [payload, payload.id] );
		payload.password = this.protectedPassword;
		return payload;
	}
	public delete = async ( id: number ) => {
		await this.db.query( 'DELETE FROM acmservers WHERE id = ?', id );
		return { id };
	}
}
