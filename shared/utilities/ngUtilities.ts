import { Subscription } from 'rxjs';

export const subsCreate = () => ( [] as Subscription[] );
export const subsDispose = ( subs: Subscription[] ) => {
	subs.forEach( s => s.unsubscribe() );
	subs = [];
};
