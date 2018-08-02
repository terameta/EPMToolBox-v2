import { ATUser } from 'shared/models/at.user';
import { ATTuple } from 'shared/models/at.tuple';
import { MainTools } from './tools.main';
import { DB } from './tools.db';

export class UserTool {

	constructor( private db: DB, private tools: MainTools ) { }

	public getAll = async (): Promise<ATUser[]> => {
		const { tuples } = await this.db.query<ATTuple>( 'SELECT * FROM users' );
		return tuples.map( t => this.tools.prepareTupleToRead<ATUser>( t ) );
	}

	public getOne = async ( id: number ): Promise<ATUser> => {
		const { tuple } = await this.db.queryOne<ATTuple>( 'SELECT * FROM users WHERE id = ?', id );
		return this.tools.prepareTupleToRead<ATUser>( tuple );
	}

	public create = async (): Promise<ATUser> => {
		const newUser = <ATUser>{ name: 'New User' };
		const { tuple } = await this.db.queryOne<any>( 'INSERT INTO users SET ?', this.tools.prepareTupleToWrite( newUser ) );
		newUser.id = tuple.insertId;
		return newUser;
	}

	public update = async ( payload: ATUser ) => {
		await this.db.queryOne( 'UPDATE users SET ? WHERE id = ?', [this.tools.prepareTupleToWrite( payload ), payload.id] );
	}

	public delete = async ( id: number ) => {
		await this.db.query( 'DELETE FROM users WHERE id = ?', id );
	}

}
