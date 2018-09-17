import { ATTagGroup } from 'shared/models/at.taggroup';
import { ATTuple } from 'shared/models/at.tuple';
import { MainTools } from './tools.main';
import { DB } from './tools.db';

export class TagGroupTool {

	constructor( private db: DB, private tools: MainTools ) { }

	public getAll = async (): Promise<ATTagGroup[]> => {
		const { tuples } = await this.db.query<ATTuple>( 'SELECT * FROM taggroups' );
		return tuples.map( t => this.tools.prepareTupleToRead<ATTagGroup>( t ) );
	}

	public getOne = async ( id: number ): Promise<ATTagGroup> => {
		const { tuple } = await this.db.queryOne<ATTuple>( 'SELECT * FROM taggroups WHERE id = ?', id );
		return this.tools.prepareTupleToRead<ATTagGroup>( tuple );
	}

	public create = async ( payload: ATTagGroup ): Promise<ATTagGroup> => {
		delete payload.id;
		const newTagGroup = { ...{ name: 'New Tag Group' }, ...payload };
		const { tuple } = await this.db.queryOne<any>( 'INSERT INTO taggroups SET ?', this.tools.prepareTupleToWrite( newTagGroup ) );
		newTagGroup.id = tuple.insertId;
		return newTagGroup;
	}

	public update = async ( payload: ATTagGroup ) => {
		await this.db.queryOne( 'UPDATE taggroups SET ? WHERE id = ?', [this.tools.prepareTupleToWrite( payload ), payload.id] );
		return { status: 'success' };
	}

	public delete = async ( id: number ) => {
		await this.db.query( 'DELETE FROM taggroups WHERE id = ?', id );
		return { status: 'success' };
	}

}
