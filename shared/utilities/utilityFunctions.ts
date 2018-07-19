export function SortByName( e1: any, e2: any ) { if ( e1.name > e2.name ) { return 1; } else if ( e1.name < e2.name ) { return -1; } else { return 0; } }
export function SortByDate( e1: any, e2: any ) { if ( e1.date > e2.date ) { return 1; } else if ( e1.date < e2.date ) { return -1; } else { return 0; } }
export function SortByDateDesc( e1: any, e2: any ) { if ( e1.date > e2.date ) { return -1; } else if ( e1.date < e2.date ) { return 1; } else { return 0; } }
export function SortByDescription( e1: any, e2: any ) { if ( e1.description > e2.description ) { return 1; } else if ( e1.description < e2.description ) { return -1; } else { return 0; } }
export function SortById( e1: any, e2: any ) { if ( e1.id > e2.id ) { return 1; } else if ( e1.id < e2.id ) { return -1; } else { return 0; } }
export function SortByIdDesc( e1: any, e2: any ) { if ( e1.id > e2.id ) { return -1; } else if ( e1.id < e2.id ) { return 1; } else { return 0; } }
export function SortByPosition( e1: any, e2: any ) { if ( e1.position > e2.position ) { return 1; } else if ( e1.position < e2.position ) { return -1; } else { return 0; } }
export function SortByToVersion( e1: any, e2: any ) { if ( e1.toVersion > e2.toVersion ) { return 1; } else if ( e1.toVersion < e2.toVersion ) { return -1; } else { return 0; } }
export function SortByNothing( e1: any, e2: any ) { return 0; }
export function isNumeric( n: any ) { return !isNaN( parseFloat( n ) ) && isFinite( n ); }
export function isInt( n: any ) { return isNumeric( n ) && n % 1 === 0; }

export const JSONDeepCopy = ( payload ) => JSON.parse( JSON.stringify( payload ) );

export function encodeXML( s: string ): string {
	return s.replace( /&/g, '&amp;' )
		.replace( /</g, '&lt;' )
		.replace( />/g, '&gt;' )
		.replace( /"/g, '&quot;' )
		.replace( /'/g, '&apos;' );
}

export const verylongelementname = 'weareexpectingnofieldordimensionnametobesamewiththisone12345678900101010292929';
export const SortByVeryLongElementName = ( e1: any, e2: any ) => {
	if ( e1[verylongelementname] > e2[verylongelementname] ) { return 1; } else if ( e1[verylongelementname] < e2[verylongelementname] ) { return -1; } else { return 0; }
};

export const waiter = ( duration: number ) => {
	return new Promise( ( resolve, reject ) => {
		setTimeout( () => {
			resolve();
		}, duration );
	} );
};

export const EnumToArray = ( curEnum: any, shouldSort?: boolean ) => {
	return Object.keys( curEnum ).filter( isNumeric ).map( ( item, index ) => ( { value: parseInt( item, 10 ), label: curEnum[item] } ) ).sort( shouldSort ? SortByName : SortByNothing );
};
export const getFormattedDate = () => {
	const myDate = new Date();
	let toReturn: string; toReturn = '';
	toReturn += myDate.getFullYear() + '-';
	toReturn += padDatePart( myDate.getMonth() + 1 ) + '-';
	toReturn += padDatePart( myDate.getDate() ) + ' ';
	toReturn += padDatePart( myDate.getHours() ) + '-';
	toReturn += padDatePart( myDate.getMinutes() ) + '-';
	toReturn += padDatePart( myDate.getSeconds() );
	return toReturn;
};
const padDatePart = ( curPart: string | number ) => {
	return ( '0' + curPart ).substr( -2 );
};
export const getMonthSorterValue = ( month: string ): string => {
	month = month.trim();
	let sorter = '';
	if ( month === 'Jan' || month === 'January' ) {
		sorter = '1';
	} else if ( month === 'Feb' || month === 'February' ) {
		sorter = '2';
	} else if ( month === 'Mar' || month === 'March' ) {
		sorter = '3';
	} else if ( month === 'Apr' || month === 'April' ) {
		sorter = '4';
	} else if ( month === 'May' ) {
		sorter = '5';
	} else if ( month === 'Jun' || month === 'June' ) {
		sorter = '6';
	} else if ( month === 'Jul' || month === 'July' ) {
		sorter = '7';
	} else if ( month === 'Aug' || month === 'August' ) {
		sorter = '8';
	} else if ( month === 'Sep' || month === 'September' ) {
		sorter = '9';
	} else if ( month === 'Oct' || month === 'October' ) {
		sorter = '10';
	} else if ( month === 'Nov' || month === 'November' ) {
		sorter = '11';
	} else if ( month === 'Dec' || month === 'December' ) {
		sorter = '12';
	} else if ( month === 'BegBalance' ) {
		sorter = '0';
	} else if ( month === 'OBL' ) {
		sorter = '0';
	} else if ( month === 'CBL' ) {
		sorter = '13';
	} else if ( isNumeric( month ) ) {
		sorter = parseFloat( month ).toString();
	} else {
		sorter = month;
	}
	sorter = sorter.substr( 0, 8 ).padStart( 8, '0' );
	return sorter;
};

export const arrayCartesian = ( arg: any[] ) => {
	const r = [];
	const max = arg.length - 1;

	const helper = ( arr, i ) => {
		for ( let j = 0, l = arg[i].length; j < l; j++ ) {
			// const a = JSON.parse( JSON.stringify( arr ) ); // arr.slice( 0 );
			const a = arr.slice( 0 );
			a.push( arg[i][j] );
			if ( i === max ) {
				r.push( a );
			} else {
				helper( a, i + 1 );
			}
		}
	};
	helper( [], 0 );
	return r;
};
