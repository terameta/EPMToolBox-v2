import { JSONDeepCopy } from '../utilities/utilityFunctions';

export interface ATNotification {
	id: string,
	title: string,
	detail: string,
	type: 'fatal' | 'error' | 'info' | 'success' | 'warning' | 'working' | 'dismissed',
	expires?: Date,
	shouldBlockUI?: boolean
}

export const ATNotificationDefault: ATNotification = { id: '', title: '', detail: '', type: 'info' };

export const newATNotification = ( id = '' ): ATNotification => ( {
	...JSONDeepCopy( ATNotificationDefault ),
	...{ expires: ( new Date( +new Date() + 9e5 ) ) },
	...{ id }
} );
