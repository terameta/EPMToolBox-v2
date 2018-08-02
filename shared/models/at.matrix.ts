import { ATReadyStatus } from '../enums/at.readystatus';
import { ATFieldDescriptionsMap } from './at.fielddescription';

// After RTDB implementation
import { ATStoreClass } from './at.storeconcept';

export class ATMatrixClass extends ATStoreClass<ATMatrix> { }

export interface ATMatrix {
	id: number,
	name: string,
	stream: number,
	isReady: ATReadyStatus,
	notReadyReason: string,
	fields: ATMatrixFieldObject,
	fieldDescriptions: ATFieldDescriptionsMap,
	matrixData: any[],
	isMatrixDataRefreshin: boolean,
	tags: any
}

export interface ATMatrixFieldObject {
	[key: number]: boolean
}

// import { ATReadyStatus } from '../../enums/generic/readiness';
// import { DimeFieldDescription, DimeFieldDescriptionsMap } from './fielddescription';

// export interface DimeMatrix {
// 	id: number,
// 	name: string,
// 	stream: number,
// 	isReady: ATReadyStatus,
// 	notReadyReason: string,
// 	fields: DimeMatrixFieldObject,
// 	fieldDescriptions: DimeFieldDescriptionsMap
// 	matrixData: any[],
// 	isMatrixDataRefreshing: boolean,
// 	tags: any
// }

// export interface DimeMatrixFieldObject {
// 	[key: number]: boolean
// }

// export interface DimeMatrixObject {
// 	[key: number]: DimeMatrix
// }

// export interface DimeMatrixRefreshPayload {
// 	id: number,
// 	filters: any,
// 	sorters: any
// }
