import { ATReadyStatus } from './generic.readiness';
import { ATEnvironmentDetail } from './at.environment';
import { ATStream, ATStreamFieldDetail } from './at.stream';
import { ATLog } from './at.log';

export interface ATProcess {
	id: number,
	name: string,
	source: number,
	target: number,
	status: ATProcessStatus,
	currentlog: number,
	erroremail: string,
	steps: ATProcessStep[],
	defaultTargets: any,
	filters: any,
	filtersDataFile: any,
	isPrepared: ATReadyStatus,
	issueList: string[],
	tags: any
}

export interface ATProcessObject {
	[key: number]: ATProcess
}

export interface ATProcessRunning extends ATProcess {
	steps: ATProcessStepRunning[],
	sourceEnvironment: ATEnvironmentDetail,
	sourceStream: ATStream,
	sourceStreamFields: ATStreamFieldDetail[],
	targetEnvironment: ATEnvironmentDetail,
	targetStream: ATStream,
	targetStreamFields: ATStreamFieldDetail[],
	isReady: { tableName: string, process: number, type: string, status: boolean }[],
	curStep: number,
	filters: any[],
	filtersDataFile: any[],
	wherers: string[],
	wherersWithSrc: string[],
	wherersDataFile: string[],
	wherersDataFileWithSrc: string[],
	pullResult: any[],
	recepients: string,
	CRSTBLDescribedFields: any[],
	mapList: number[]
}

export interface ATProcessStep {
	id: number,
	process: number,
	type: ATProcessStepType,
	referedid: number,
	details: string,
	detailsObject: any,
	position: number
}

export interface ATProcessStepRunning extends ATProcessStep {
	isPending: boolean
}

export interface ATCartesianDefinitions {
	cartesianArray: any[],
	cartesianTemp: any[],
	cartesianFields: any[],
	inserterFields: any[],
	dataFieldDefinition: any
}

export enum ATProcessStepType {
	SourceProcedure = 'srcprocedure',
	PullData = 'pulldata',
	MapData = 'mapdata',
	TransformData = 'transform',
	ValidateData = 'validate',
	PushData = 'pushdata',
	TargetProcedure = 'tarprocedure',
	SendData = 'senddata',
	SendMissingMaps = 'sendmissing',
	SendLogs = 'sendlogs'
}

export function getATProcessStepTypeNames() {
	const toReturn: any = {};
	Object.keys( ATProcessStepType ).forEach( currentType => {
		toReturn[ATProcessStepType[currentType]] = currentType.split( '' ).map( character => ( character.toLowerCase() === character ? character : ' ' + character ) ).join( '' ).trim();
	} );
	return toReturn;
}

export interface ATProcessDefaultTarget {
	id: number,
	process: number,
	field: string,
	value: string
}

export interface ATProcessTransformation {
	when: string,
	field: string,
	comparer: string,
	comparison: string,
	whichField: string,
	operation: string,
	operator: string,
	position: number,
	fieldToManipulate: any
}

export enum ATProcessStatus {
	Ready = 0,
	Running = 1
}

export interface ATProcessLogPayload {
	id: number,
	log: ATLog
}
