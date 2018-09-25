// After RTDB implementation
import { ATStoreClass } from './at.storeconcept';
import { JSONDeepCopy } from '../utilities/utilityFunctions';

export class ATStreamClass extends ATStoreClass<ATStream> { }

export interface ATStream {
	id: number,
	name: string,
	type: ATStreamType,
	environment: number,
	dbName: string,
	tableName: string,
	customQuery: string,
	finalQuery: string,
	tags: any,
	exports: ATStreamExport[],
	databaseList: { name: string }[],
	tableList: { name: string, type?: string }[],
	fieldList: ATStreamField[]
}

export const getDefaultATStream = () => ( <ATStream>JSONDeepCopy( { tags: {}, exports: [] } ) );
export const getDefaultATStreamExport = () => ( <ATStreamExport>JSONDeepCopy( { name: '' } ) );

export interface ATStreamField {
	name: string,
	type: string,
	position: number,
	isDescribed: boolean
	fCharacters: number,
	fPrecision: number,
	fDecimals: number,
	fDateFormat: string,
	shouldIgnoreCrossTab: boolean,
	isFilter: boolean,
	isCrossTabFilter: boolean,
	isCrossTab: boolean,
	isMonth: boolean,
	isData: boolean,
	aggregateFunction: string,
	description: ATStreamFieldDescription
}

export interface ATStreamFieldDescription {
	database: string,
	table: string,
	query: string,
	tableList: any[],
	fieldList: any[],
	referenceField: {
		name: string,
		type: string,
		characters: number,
		precision: number,
		decimals: number,
		dateformat: string
	},
	descriptionField: {
		name: string,
		type: string,
		characters: number,
		precision: number,
		decimals: number,
		dateformat: string
	}
}

// Before new changes

export interface ATStreamExport {
	name: string
}

export interface ATStreamExportHPDB extends ATStreamExport {
	rowDims: any[],
	colDims: any[],
	povDims: any[],
	cellCounts: any,
	cellCount: number,
	rows: any[],
	cols: any[],
	povs: any[]
}

export const getDefaultATStreamExportHPDB = () => ( <ATStreamExportHPDB>JSONDeepCopy( {
	name: '',
	rowDims: [], colDims: [], povDims: [],
	cellCounts: <any>{},
	rows: [], cols: [], povs: []
} ) );

export interface ATStreamFieldOLD {
	id: number,
	stream: number,
	name: string,
	type: string,
	position: number,
	isDescribed: boolean
}

export interface ATStreamFieldDetailOLD extends ATStreamFieldOLD {
	fCharacters: number,
	fPrecision: number,
	fDecimals: number,
	fDateFormat: string,
	shouldIgnoreCrossTab: boolean,
	isFilter: boolean,
	isCrossTabFilter: boolean,
	isCrossTab: boolean,
	isMonth: boolean,
	isData: boolean,
	aggregateFunction: string,
	descriptiveDB: string,
	descriptiveTable: string,
	descriptiveTableList: any[],
	descriptiveFieldList: any[],
	descriptiveQuery: string,
	drfName: string,
	drfType: string,
	drfCharacters: number,
	drfPrecision: number,
	drfDecimals: number,
	drfDateFormat: string,
	ddfName: string,
	ddfType: string,
	ddfCharacters: number,
	ddfPrecision: number,
	ddfDecimals: number,
	ddfDateFormat: string
}

export enum ATStreamType {
	'RDBT' = 1,
	'HPDB' = 2
}

export function atGetStreamTypeDescription( typecode: number | string ) {
	switch ( typecode ) {
		case 1:
		case '1':
		case 'RDBT': {
			return 'Relational Database Table/View';
		}
		case 2:
		case '2':
		case 'HPDB': {
			return 'Hyperion Planning Database';
		}
	}
}
