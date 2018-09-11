import { DB } from './tools.db';
import { MainTools } from './tools.main';
import { ATCredential } from 'shared/models/at.credential';
import { ATTuple } from 'shared/models/at.tuple';

export class CredentialTool {
	constructor( private db: DB, private tools: MainTools ) { }

	public getAll = async (): Promise<ATCredential[]> => {
		const { tuples } = await this.db.query<ATTuple>( 'SELECT * FROM credentials' );
		return tuples.
			map( t => this.tools.prepareTupleToRead<ATCredential>( t ) ).
			map( this.prepareCredentialToRead );
	}

	public getOne = ( id: number ) => this.getCredentialDetails( id );

	public create = async ( payload: ATCredential ): Promise<ATCredential> => {
		delete payload.id;
		const newCredential = Object.assign( <ATCredential>{ name: 'New Credential' }, payload );
		if ( newCredential.password && newCredential.password !== '|||---protected---|||' ) {
			newCredential.password = this.tools.encryptText( newCredential.password );
		}
		const result = await this.db.queryOne<any>( 'INSERT INTO credentials SET ?', this.tools.prepareTupleToWrite( newCredential ) );
		newCredential.id = result.tuple.insertId;
		return newCredential;
	}

	public update = async ( payload: ATCredential ) => {
		const passwordOnDB = await this.getCredentialDetails( payload.id, false, true );
		if ( payload.password === '|||---protected---|||' ) {
			payload.password = passwordOnDB.password;
		} else {
			payload.password = this.tools.encryptText( payload.password );
		}
		await this.db.queryOne( 'UPDATE credentials SET ? WHERE id = ?', [this.tools.prepareTupleToWrite( payload ), payload.id] );
		return { status: 'success' };
	}

	public delete = async ( id: number ) => {
		await this.db.query( 'DELETE FROM credentials WHERE id = ?', id );
		return { status: 'success' };
	}

	private prepareCredentialToRead = ( payload ) => {
		payload.password = '|||---protected---|||';
		return payload;
	}

	public getCredentialDetails = async ( id: number, reveal = false, leaveAsItIs = false ): Promise<ATCredential> => {
		const { tuple } = await this.db.queryOne<ATTuple>( 'SELECT * FROM credentials WHERE id = ?', id );
		const credential = this.tools.prepareTupleToRead<ATCredential>( tuple );
		if ( reveal ) {
			credential.password = this.tools.decryptText( credential.password );
		} else if ( !leaveAsItIs ) {
			this.prepareCredentialToRead( credential );
		}
		return credential;
	}

	public reveal = async ( id: number ) => {
		const credential = await this.getCredentialDetails( id, true );
		return { password: credential.password };
	}
}
