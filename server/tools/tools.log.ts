import { MainTools } from './tools.main';
import { DB } from './tools.db';
import { ATLog } from 'shared/models/at.log';

export class LogTool {
	constructor( public db: DB, public tools: MainTools ) { }

	public getAll = async (): Promise<ATLog[]> => {
		const { tuples } = await this.db.query<ATLog>( 'SELECT * FROM logs ORDER BY start DESC' );
		return tuples;
	}
	public getOne = async ( id: number ): Promise<ATLog> => {
		const { tuple } = await this.db.queryOne<ATLog>( 'SELECT * FROM logs WHERE id = ?', id );
		return tuple;
	}

	public create = async ( payload: ATLog, closeImmediately = false ): Promise<number> => {
		delete payload.id;
		payload.start = new Date();
		if ( closeImmediately ) payload.end = payload.start;
		if ( !payload.parent ) payload.parent = 0;
		if ( typeof payload.details !== 'string' ) payload.details = JSON.stringify( payload.details );
		payload.details = payload.start.toString() + ': ' + payload.details.toString().trim();
		const { tuple } = await this.db.queryOne<any>( 'INSERT INTO logs SET ?', payload );
		return tuple.insertId;
	}

	public openLog = ( details: string, parent: number, reftype: string, refid: number ): Promise<number> => {
		return this.create( <ATLog>{ parent, details, reftype, refid } );
	}

	public checkLog = ( id: number ) => this.getOne( id );

	public closeLog = async ( id: number ) => {
		const curDate = new Date();
		await this.db.queryOne( 'UPDATE logs SET end = ?, details = CONCAT_WS(\'\n\', details, ?) WHERE id = ?', [curDate, curDate.toString() + ': Closed', id] );

	}
	public appendLog = async ( id: number, details: string, logDate = new Date() ) => {
		details = logDate.toString() + ': ' + details.toString().trim();
		await this.db.queryOne( 'UPDATE logs SET details = CONCAT_WS(\'\n\', details, ?) WHERE id = ?', [details, id] );
	}

	public recordLog = ( details: string, parent: number, reftype: string, refid: number ) => {
		return this.openLog( details, parent, reftype, refid );
	}
	public getAllLogs = async ( payload: { type: string, id: number } ): Promise<ATLog[]> => {
		const { tuples } = await this.db.query<ATLog>( 'SELECT * FROM logs WHERE reftype = ? AND refid = ? ORDER BY end DESC', [payload.type, payload.id] );
		return tuples;
	}
}
