import * as bcrypt from 'bcrypt';
import * as ActiveDirectory from 'activedirectory';

import { DB } from './tools.db';
import { MainTools } from './tools.main';
import { ATUser } from '../../shared/models/at.user';
import { ATDirectoryServer } from '../../shared/models/at.directoryserver';
import { ATDirectoryServerTool } from './tools.directoryserver';
import * as jwt from 'jsonwebtoken';
import { ATApiPayload } from 'shared/models/at.socketrequest';
import { ATTuple } from 'shared/models/at.tuple';

interface AuthObjectDirectory {
	username: string,
	password: string,
	dbUser: ATUser,
	// ldapClient: ldap.Client,
	ldapClient: any,
	ldapServer: ATDirectoryServer
}

export class AuthTool {
	private directoryServerTool: ATDirectoryServerTool;
	constructor(
		public db: DB,
		public tools: MainTools
	) {
		this.directoryServerTool = new ATDirectoryServerTool( this.db, this.tools );
	}

	public signin = async ( payload: { username: string, password: string } ) => {
		if ( !payload.username || !payload.password ) { throw new Error( 'Either username or password missing' ); }
		return this.authenticate( payload );
	}
	public reauthenticate = async ( payload: { token: string } ) => {
		const oldToken: any = await this.tools.verifyToken( payload.token ).catch();
		if ( oldToken ) {
			delete oldToken.iat;
			delete oldToken.exp;
			return this.authenticateAction( oldToken );
		} else {
			throw new Error( 'Token has expired' );
		}
	}

	private authenticate = async ( payload: { username: string, password: string } ) => {
		const fixedUserName = escape( payload.username.toString().toLowerCase() );
		const { tuples } = await this.db.query<ATTuple>( 'SELECT * FROM users' );
		const users = tuples.map( t => this.tools.prepareTupleToRead<ATUser>( t ) ).filter( u => u.username === fixedUserName );
		if ( users.length === 0 ) {
			throw new Error( 'Authentication failed.' );
		} else if ( users.length > 1 ) {
			throw new Error( 'Multiple users are defined with the same username. Please consult with system admin.' );
		} else {
			const dbUser = users[0];
			if ( dbUser.type === 'local' ) {
				return this.authenticateWithLocal( payload.password, dbUser );
			} else if ( dbUser.type === 'directory' ) {
				return this.authenticateWithDirectory( payload.username, payload.password, dbUser );
			} else {
				throw new Error( 'Wrong user type. Please consult with system admin.' );
			}
		}
	}

	private authenticateAction = async ( dbUser: ATUser ) => {
		delete dbUser.password;
		return { token: this.tools.signToken( dbUser ) };
	}

	private authenticateWithLocal = ( password: string, dbUser: ATUser ) => {
		return new Promise( ( resolve, reject ) => {
			bcrypt.compare( password, dbUser.password, ( err, hashResult ) => {
				if ( err ) {
					reject( 'There is an issue with the encryption. Please consult with the system admin.' );
				} else if ( !hashResult ) {
					reject( 'Authentication failed' );
				} else {
					resolve( this.authenticateAction( dbUser ) );
				}
			} );
		} );
	}
	private authenticateWithDirectory = async ( username: string, password: string, dbUser: ATUser ) => {
		let authObj: AuthObjectDirectory; authObj = <AuthObjectDirectory>{};
		authObj.username = username;
		authObj.password = password;
		authObj.dbUser = dbUser;

		authObj.ldapServer = await this.directoryServerTool.getServerDetails( dbUser.ldapserver, true );
		await this.authenticateWithDirectoryBind( authObj );
		await this.authenticateWithDirectorySearch( authObj );
		await this.authenticateWithDirectoryAuthenticate( authObj );
		return this.authenticateAction( authObj.dbUser );
	}
	private authenticateWithDirectoryBind = ( authObj: AuthObjectDirectory ) => {
		return new Promise( ( resolve, reject ) => {
			const config = {
				url: 'ldap://' + authObj.ldapServer.hostname + ':' + authObj.ldapServer.port,
				baseDN: authObj.ldapServer.basedn,
				username: authObj.ldapServer.userdn,
				password: authObj.ldapServer.password
			};
			const ldapClient = new ActiveDirectory( config );
			authObj.ldapClient = ldapClient;
			authObj.ldapClient.authenticate( authObj.ldapServer.prefix + '\\' + authObj.ldapServer.userdn, authObj.ldapServer.password, ( err: any, auth: any ) => {
				if ( err ) {
					reject( new Error( 'There is an error with the directory server configuration. Please consult with the system admin.' ) );
				} else if ( auth ) {
					resolve( authObj );
				} else {
					reject( new Error( 'There is an issue with the directory server binding. Please consult with the system admin.' ) );
				}
			} );
		} );
	}
	private authenticateWithDirectorySearch = ( authObj: AuthObjectDirectory ) => {
		return new Promise( ( resolve, reject ) => {
			authObj.ldapClient.findUsers( 'mail=' + authObj.username, ( err: any, users: any ) => {
				if ( err ) {
					reject( err );
				} else if ( !users ) {
					reject( new Error( 'User not found in the directory' ) );
				} else if ( users.length !== 1 ) {
					reject( new Error( 'User not found in the directory.' ) );
				} else {
					authObj.username = users[0].userPrincipalName;
					resolve( authObj );
				}
			} );
		} );
	}
	private authenticateWithDirectoryAuthenticate = ( authObj: AuthObjectDirectory ) => {
		return new Promise( ( resolve, reject ) => {
			authObj.ldapClient.authenticate( authObj.username, authObj.password, ( err: any, auth: any ) => {
				if ( err ) {
					console.log( err );
					reject( new Error( 'User authentication has failed.' ) );
				} else if ( auth ) {
					resolve( authObj.dbUser );
				} else {
					reject( new Error( 'User authentication has failed!' ) );
				}
			} );
		} );
	}
}
