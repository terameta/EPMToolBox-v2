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

// import { Pool } from 'mysql';
// import { MainTools } from './tools.main';

// import { DimeTagGroup } from '../../shared/model/dime/taggroup';

// export class TagGroupTools {
// 	constructor( public db: Pool, public tools: MainTools ) { }

// 	public getAll = (): Promise<DimeTagGroup[]> => {
// 		return new Promise( ( resolve, reject ) => {
// 			this.db.query( 'SELECT * FROM taggroups ORDER BY position', {}, ( err, rows: DimeTagGroup[], fields ) => {
// 				if ( err ) {
// 					reject( err.code );
// 				} else {
// 					rows.forEach( ( curTuple, curKey ) => {
// 						if ( curTuple.position !== curKey ) {
// 							curTuple.position = curKey;
// 							this.update( curTuple );
// 						}
// 					} );
// 					resolve( rows );
// 				}
// 			} );
// 		} );
// 	}

// 	public getOne = ( id: number ): Promise<DimeTagGroup> => {
// 		return new Promise( ( resolve, reject ) => {
// 			this.db.query( 'SELECT * FROM taggroups WHERE id = ?', id, ( err, rows, fields ) => {
// 				if ( err ) {
// 					reject( err.code );
// 				} else if ( rows.length !== 1 ) {
// 					reject( new Error( 'Wrong number of records for tag group received from the server, 1 expected' ) );
// 				} else {
// 					resolve( rows[0] );
// 				}
// 			} );
// 		} );
// 	}

// 	public create = ( refItem: DimeTagGroup ): Promise<DimeTagGroup> => {
// 		const newTagGroup: DimeTagGroup = <DimeTagGroup>{ name: 'New Tag Group' };
// 		if ( refItem.name ) { newTagGroup.name = refItem.name; }
// 		return new Promise( ( resolve, reject ) => {
// 			this.db.query( 'SELECT MAX(position) AS maxpos FROM taggroups', {}, ( err, rows, fields ) => {
// 				if ( err ) {
// 					reject( err.code );
// 				} else {
// 					newTagGroup.position = parseInt( rows[0].maxpos, 10 ) + 1;
// 					this.db.query( 'INSERT INTO taggroups SET ?', newTagGroup, ( ierr, result, ifields ) => {
// 						if ( ierr ) {
// 							reject( ierr.code );
// 						} else {
// 							newTagGroup.id = result.insertId;
// 							resolve( newTagGroup );
// 						}
// 					} );
// 				}
// 			} );
// 		} );
// 	}

// 	public update = ( refItem: DimeTagGroup ): Promise<DimeTagGroup> => {
// 		delete refItem.isReordered;
// 		return new Promise( ( resolve, reject ) => {
// 			this.db.query( 'UPDATE taggroups SET ? WHERE id = ' + refItem.id, refItem, ( err, rows, fields ) => {
// 				if ( err ) {
// 					reject( err.code );
// 				} else {
// 					resolve( refItem );
// 				}
// 			} );
// 		} );
// 	}

// 	public delete = ( id: number ) => {
// 		return new Promise( ( resolve, reject ) => {
// 			this.db.query( 'DELETE FROM taggroups WHERE id = ?', id, ( err, rows, fields ) => {
// 				if ( err ) {
// 					reject( err.code );
// 				} else {
// 					resolve( { id: id } );
// 				}
// 			} );
// 		} );
// 	}
// }
