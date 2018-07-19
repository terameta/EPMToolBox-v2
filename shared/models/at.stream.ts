export interface ATStream {
	id: number,
	name: string,
	type: number,
	environment: number,
	dbName: string,
	tableName: string,
	customQuery: string,
	finalQuery: string,
	tags: any,
	exports: any[]
}

export interface ATStreamDetail extends ATStream {
	databaseList: { name: string }[],
	tableList: { name: string }[],
	fieldList: ATStreamFieldDetail[]
}

export interface ATStreamExport {
	id: number,
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

export interface ATStreamField {
	id: number,
	stream: number,
	name: string,
	type: string,
	position: number,
	isDescribed: boolean
}

export interface ATStreamFieldDetail extends ATStreamField {
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
