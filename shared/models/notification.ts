import { JSONDeepCopy } from '../utilities/utilityFunctions';

export interface ATNotification {
	title: string,
	detail: string,
	type: 'fatal' | 'error' | 'info' | 'success' | 'warning',
	expires?: Date,
	shouldBlockUI?: boolean
}

export const ATNotificationDefault: ATNotification = { title: '', detail: '', type: 'info' };

export const newATNotification = (): ATNotification => ( { ...JSONDeepCopy( ATNotificationDefault ), ...{ expires: ( new Date( +new Date() + 9e5 ) ) } } );
