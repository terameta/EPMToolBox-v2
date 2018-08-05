export interface ATApiCommunication {
	framework: string,
	action: string,
	payload: ATApiPayload,
	token?: string,
	uuid?: string
}

export interface ATApiPayload {
	status: 'success' | 'error' | 'request',
	data?: any
}
