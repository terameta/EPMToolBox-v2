import { ConnectionPool, config as MSSQLConfig } from 'mssql';

import { MainTools } from './tools.main';
import { ATEnvironmentDetail } from 'shared/models/at.environment';
import { ATStreamField } from 'shared/models/at.stream';
import { DB } from './tools.db';

export class MSSQLTool {

	constructor( private db: DB, public tools: MainTools ) { }

	public verify = ( payload: ATEnvironmentDetail ) => this.connect( payload );

	private connect = async ( payload: ATEnvironmentDetail ) => {
		const dbConfig: MSSQLConfig = <MSSQLConfig>{
			user: payload.username || '',
			password: payload.password || '',
			server: payload.server || '',
			connectionTimeout: 300000,
			requestTimeout: 6000000,
		};

		if ( payload.database ) { dbConfig.database = payload.database; }
		if ( payload.server ) {
			dbConfig.server = payload.server;
			// This means we are not on a named instance.
			// As per the documentation if you are using a named instance, you shouldn't setup port.
			// Since we are not on a named instance, we will now setup port.
			if ( payload.server.split( '\\' ).length === 1 && payload.port ) { dbConfig.port = parseInt( payload.port, 10 ); }
		}
		payload.mssql.connection = await new ConnectionPool( dbConfig ).connect();
	}

	public listDatabases = async ( payload: ATEnvironmentDetail ) => {
		await this.connect( payload );
		const { recordset } = await payload.mssql.connection.request().query( 'SELECT name FROM sys.databases WHERE name NOT IN (\'master\', \'tempdb\', \'model\', \'msdb\')' );
		return recordset;
	}

	public listTables = async ( payload: ATEnvironmentDetail ) => {
		await this.connect( payload );
		const { recordset } = await payload.mssql.connection.request().query( 'SELECT TABLE_NAME, TABLE_TYPE FROM ' + payload.database + '.INFORMATION_SCHEMA.Tables ORDER BY 2, 1' );
		return recordset.
			map( tuple => ( { name: tuple.TABLE_NAME, type: tuple.TABLE_TYPE } ) ).
			push( { name: 'Custom Query', type: 'Custom Query' } );
	}

	public listFields = async ( payload: ATEnvironmentDetail ) => {
		await this.connect( payload );
		payload.query = payload.query ? payload.query : 'SELECT * FROM ' + payload.table;
		const { recordset } = await payload.mssql.connection.request().query( 'SELECT TOP 100 * FROM (' + payload.query + ') T' );
		if ( recordset.length === 0 ) throw new Error( 'No records received, can\'t process the fields' );
		// const fields: ATStreamField[] = [];
		const fields: ATStreamField[] = Object.keys( recordset[0] ).map( ( field, key ) => ( <ATStreamField>{ name: field, position: ( key + 1 ) } ) );
		fields.forEach( field => {
			let isString = 0;
			let isNumber = 0;
			let isDate = 0;
			recordset.forEach( tuple => {
				if ( typeof tuple[field.name] === 'string' ) {
					isString++;
				} else if ( typeof tuple[field.name] === 'number' ) {
					isNumber++;
				} else {
					const checker = new Date( tuple[field.name] );
					if ( checker instanceof Date && !isNaN( checker.valueOf() ) ) isDate++;
				}
			} );
			field.type = 'undefined';
			let typemax = 0;
			if ( isString > typemax ) { field.type = 'string'; typemax = isString; }
			if ( isNumber > typemax ) { field.type = 'number'; typemax = isNumber; }
			if ( isDate > typemax ) { field.type = 'date'; }
		} );
		return fields;
	}

	public listAliasTables = async ( payload: ATEnvironmentDetail ) => {
		return ['default'];
	}

	public runProcedure = async ( payload: ATEnvironmentDetail ) => {
		await this.connect( payload );
		const { recordset } = await payload.mssql.connection.request().query( payload.procedure );
		return recordset;
	}

	public getDescriptions = async ( payload: ATEnvironmentDetail, field: ATStreamField ) => {
		await this.connect( payload );
		let query = '';
		query += 'SELECT DISTINCT ' + field.description.referenceField.name + ' AS RefField, ' + field.description.descriptionField.name + ' AS Description ';
		query += 'FROM ';
		if ( field.description.table === 'Custom Query' ) {
			query += '(' + field.description.query + ') AS TCQ';
		} else {
			query += field.description.table;
		}
		query += ' ORDER BY 1, 2';
		const { recordset } = await payload.mssql.connection.request().query( query );
		return recordset;
	}

	public getDescriptionsWithHierarchy = ( payload: ATEnvironmentDetail, field: ATStreamField ) => this.getDescriptions( payload, field );

	public writeData = async ( payload: ATEnvironmentDetail ) => {
		throw new Error( 'We are curretly unable to write data to MSSQL tables' );
	}
}
