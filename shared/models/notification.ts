import { JSONDeepCopy } from '../utilities/utilityFunctions';

export interface ATNotification {
	title: string,
	detail: string,
	type: 'error' | 'info' | 'success' | 'warning',
	expires?: Date
}

export const ATNotificationDefault: ATNotification = { title: '', detail: '', type: 'info' };

export const newATNotification = (): ATNotification => ( { ...JSONDeepCopy( ATNotificationDefault ), ...{ expires: ( new Date( +new Date() + 9e5 ) ) } } );
