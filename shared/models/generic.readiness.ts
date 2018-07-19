export enum ATReadyStatus {
	NotReady = 0,
	Ready = 1,
	Checking = -1
}

export interface IsReadyPayload {
	isready: ATReadyStatus,
	issue?: string,
}

export interface IsPreparedPayload {
	isPrepared: ATReadyStatus,
	issueList?: string[]
}
