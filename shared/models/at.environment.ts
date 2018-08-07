import { ATStoreClass } from './at.storeconcept';
import { JSONDeepCopy } from '../utilities/utilityFunctions';
import { ConnectionPool } from 'mssql';

export class ATEnvironmentClass extends ATStoreClass<ATEnvironment> { }

export interface ATEnvironment {
	id: number,
	name: string,
	type: number,
	server: string,
	port: string,
	verified: number,
	identitydomain: string,
	credential: number,
	tags: { [key: number]: boolean },
	SID: string,
	ssotoken: string
}

export interface ATEnvironmentDetail extends ATEnvironment {
	database: string,
	table: string,
	mssql: {
		connection: ConnectionPool
	},
	smartview: {
		url: string,
		planningurl: string,
		planningserver: string,
		applications: { name: string }[],
		cubes: string[],
		dimensions: any[],
		aliastables: any[],
		memberList: any[],
		procedure: { name: string, type: string, hasRTP: string, variables: any[] },
		cookies: string
	}
	query: string,
	procedure: string,
	username: string,
	password: string
}

export const getDefaultATEnvironment = () => ( <ATEnvironment>JSONDeepCopy( { tags: {} } ) );

export enum ATEnvironmentType {
	'HP' = 1,
	'MSSQL' = 2,
	'PBCS' = 3,
	'ORADB' = 4
}

export function atGetEnvironmentTypeDescription( typecode: number | string ) {
	switch ( typecode ) {
		case 1:
		case '1':
		case 'HP': {
			return 'Hyperion Planning On-Premises';
		}
		case 2:
		case '2':
		case 'MSSQL': {
			return 'Microsoft SQL Server';
		}
		case 3:
		case '3':
		case 'PBCS': {
			return 'Hyperion Planning PBCS';
		}
		case 4:
		case '4':
		case 'ORADB': {
			return 'Oracle Database Server';
		}
	}
}
