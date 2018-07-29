export enum ATReadyStatus {
	NotReady = 0,
	Ready = 1,
	Checking = -1
}

export interface ATIsReadyPayload {
	isready: ATReadyStatus,
	issue?: string,
}

export interface ATIsPreparedPayload {
	isPrepared: ATReadyStatus,
	issueList?: string[]
}
