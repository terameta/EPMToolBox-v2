export interface ATSmartViewRequestOptions {
	method?: 'POST' | 'GET',
	url: string,
	body?: string,
	contentType?: string,
	cookie?: string,
	timeout?: number,
	followRedirect?: boolean,
	referer?: string,
	form?: any
}
