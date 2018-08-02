// After RTDB implementation
import { ATStoreClass } from './at.storeconcept';

export class ATMapClass extends ATStoreClass<ATMap> { }

// Before new changes

import { ATReadyStatus } from '../enums/at.readystatus';
import { ATFieldDescription } from './at.fielddescription';

export interface ATMap {
	id: number,
	name: string,
	type: number,
	source: number,
	target: number,
	matrix: number,
	isready: ATReadyStatus,
	sourcefields: ATMapField[],
	targetfields: ATMapField[],
	isMapDataRefreshing: boolean,
	mapData: any[],
	tags: any
}

export interface ATMapField {
	id: number,
	map: number,
	srctar: 'source' | 'target',
	name: string,
	descriptions: ATFieldDescription[]
}

export interface ATMapRefreshPayload {
	id: number,
	filters: ATMapFilterTuple[],
	sorters: any
}

export interface ATMapFilterTuple {
	name: string,
	type: 'is' | 'co' | 'bw' | 'ew',
	value: string
}
