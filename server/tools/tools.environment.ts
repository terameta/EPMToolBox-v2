import { MainTools } from './tools.main';
import { DB } from './tools.db';
import { ATTuple } from '../../shared/models/at.tuple';
import { CredentialTool } from './tools.credential';
import { HPTool } from './tools.hp';
import { PBCSTool } from './tools.pbcs';
import { MSSQLTool } from './tools.mssql';
import { ATEnvironmentType, ATEnvironment, ATEnvironmentDetail, atEnvironmentPrepareToSave } from '../../shared/models/at.environment';
import { ATStream, ATStreamField } from '../../shared/models/at.stream';

export class EnvironmentTool {
	private credentialTool: CredentialTool;
	private sourceTools: any;

	constructor( private db: DB, private tools: MainTools ) {
		this.credentialTool = new CredentialTool( db, tools );
		this.sourceTools = {};
		this.sourceTools[ATEnvironmentType.HP] = new HPTool( this.db, this.tools );
		this.sourceTools[ATEnvironmentType.PBCS] = new PBCSTool( this.db, this.tools );
		this.sourceTools[ATEnvironmentType.MSSQL] = new MSSQLTool( this.db, this.tools );
	}

	public getAll = async (): Promise<ATEnvironment[]> => {
		const { tuples } = await this.db.query<ATTuple>( 'SELECT * FROM environments' );
		return tuples.map( t => this.tools.prepareTupleToRead<ATEnvironment>( t ) );
	}

	public getOne = ( id: number ) => this.getEnvironmentDetails( id );

	public create = async ( payload: ATEnvironment ): Promise<ATEnvironment> => {
		delete payload.id;
		payload.verified = false;
		const newEnvironment = Object.assign( <ATEnvironment>{ name: 'New Environment' }, payload );
		const result = await this.db.queryOne<any>( 'INSERT INTO environments SET ?', this.tools.prepareTupleToWrite( newEnvironment ) );
		newEnvironment.id = result.tuple.insertId;
		return newEnvironment;
	}

	public update = async ( payload: ATEnvironmentDetail ) => {
		atEnvironmentPrepareToSave( payload );
		await this.db.queryOne( 'UPDATE environments SET ? WHERE id = ?', [this.tools.prepareTupleToWrite( payload ), payload.id] );
	}

	public delete = async ( id: number ) => {
		await this.db.query( 'DELETE FROM environments WHERE id = ?', id );
	}

	public getEnvironmentDetails = async ( id: number, reveal = false ): Promise<ATEnvironmentDetail> => {
		const { tuple } = await this.db.queryOne<ATTuple>( 'SELECT * FROM environments WHERE id = ?', id );
		const toReturn = this.tools.prepareTupleToRead<ATEnvironmentDetail>( tuple );
		if ( reveal ) {
			const { username, password } = await this.credentialTool.getCredentialDetails( toReturn.credential, true );
			toReturn.username = username;
			toReturn.password = password;
		}
		if ( toReturn.type === ATEnvironmentType.MSSQL && !toReturn.mssql ) toReturn.mssql = { connection: null };
		return toReturn;
	}

	public verify = async ( id: number ) => {
		const payload = await this.getEnvironmentDetails( id, true );
		await this.sourceTools[payload.type].verify( payload );
		await this.setVerified( payload );
		return { id, result: 'OK' };
	}
	private setVerified = async ( payload: ATEnvironmentDetail ) => this.update( Object.assign( payload, { verified: true } ) );

	public listDatabases = async ( id: number ) => {
		const payload = await this.getEnvironmentDetails( id, true );
		return await this.sourceTools[payload.type].listDatabases( payload );
	}
	public listTables = async ( payload: { id: number, database: string } ) => {
		console.log( 'We are at listTables@tools.environment.ts', payload );
		const lister = await this.getEnvironmentDetails( payload.id, true );
		console.log( 'We are at listTables@tools.environment.ts, received environment details' );
		if ( payload.database ) lister.database = payload.database;
		return await this.sourceTools[lister.type].listTables( lister );
	}
	public listDescriptiveTables = async ( id: number, database: string, table: string ) => {
		const payload = await this.getEnvironmentDetails( id, true );
		if ( database ) payload.database = database;
		if ( table ) payload.table = table;
		return await this.sourceTools[payload.type].listTables( payload );
	}
	public listFields = async ( id: number, database: string, query: string, table: string ) => {
		const payload = await this.getEnvironmentDetails( id, true );
		if ( database ) payload.database = database;
		if ( query ) payload.query = query;
		if ( table ) payload.table = table;
		return await this.sourceTools[payload.type].listFields( payload );
	}
	public listAliasTables = async ( id: number, database: string, query: string, table: string ) => {
		const payload = await this.getEnvironmentDetails( id, true );
		if ( database ) payload.database = database;
		if ( query ) payload.query = query;
		if ( table ) payload.table = table;
		return await this.sourceTools[payload.type].listAliasTables( payload );
	}
	public listProcedures = async ( stream: ATStream ) => {
		const payload = await this.getEnvironmentDetails( stream.environment, true );
		if ( stream.dbName ) payload.database = stream.dbName;
		if ( stream.tableName ) payload.table = stream.tableName;
		return await this.sourceTools[payload.type].listProcedures( payload );
	}
	public listProcedureDetails = async ( refObj: { stream: ATStream, procedure: any } ) => {
		const payload = await this.getEnvironmentDetails( refObj.stream.environment, true );
		if ( refObj.stream.dbName ) payload.database = refObj.stream.dbName;
		if ( refObj.stream.tableName ) payload.table = refObj.stream.tableName;
		payload.procedure = refObj.procedure;
		return await this.sourceTools[payload.type].listProcedureDetails( payload );
	}
	public runProcedure = async ( refObj: { stream: ATStream, procedure: any } ) => {
		if ( !refObj ) throw new Error( 'No object passed.' );
		if ( !refObj.stream ) throw new Error( 'No stream passed.' );
		if ( !refObj.stream.environment ) throw new Error( 'Malformed stream object' );
		if ( !refObj.procedure ) throw new Error( 'Procedure definition is missing' );
		const payload = await this.getEnvironmentDetails( refObj.stream.environment, true );
		if ( refObj.stream.dbName ) payload.database = refObj.stream.dbName;
		if ( refObj.stream.tableName ) payload.table = refObj.stream.tableName;
		payload.procedure = refObj.procedure;
		if ( refObj.procedure ) {
			if ( refObj.procedure.tableName ) payload.table = refObj.procedure.tableName;
		}
		return await this.sourceTools[payload.type].runProcedure( payload );
	}
	public getDescriptions = async ( stream: ATStream, field: ATStreamField ) => {
		const payload = await this.getEnvironmentDetails( stream.environment, true );
		payload.database = stream.dbName;
		payload.table = stream.tableName;
		return await this.sourceTools[payload.type].getDescriptions( payload, field );
	}
	public getDescriptionsWithHierarchy = async ( stream: ATStream, field: ATStreamField ) => {
		const payload = await this.getEnvironmentDetails( stream.environment, true );
		payload.database = stream.dbName;
		payload.table = stream.tableName;
		return await this.sourceTools[payload.type].getDescriptionsWithHierarchy( payload, field );
	}
	public writeData = async ( refObj: any ) => {
		const payload: any = await this.getEnvironmentDetails( refObj.id, true );
		payload.database = refObj.db;
		payload.table = refObj.table;
		payload.data = refObj.data;
		payload.sparseDims = refObj.sparseDims;
		payload.denseDim = refObj.denseDim;
		return await this.sourceTools[payload.type].writeData( payload );
	}
	public readData = async ( id: number, database: string, table: string, query: any ) => {
		const payload = await this.getEnvironmentDetails( id, true );
		payload.database = database;
		payload.table = table;
		payload.query = query;
		return await this.sourceTools[payload.type].readData( payload );
	}
}
