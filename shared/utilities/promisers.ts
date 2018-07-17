import * as fs from 'fs';
import * as request from 'request';

export const readFile = ( path: string, encoding: string = 'utf8' ) => {
	return new Promise( ( resolve, reject ) => {
		fs.readFile( path, encoding, ( error, data ) => {
			if ( error ) {
				reject( error );
			} else {
				resolve( data );
			}
		} );
	} );
};

export const jsonParse = ( toParse: string ) => {
	return new Promise( ( resolve, reject ) => {
		try {
			const toReturn = JSON.parse( toParse );
			resolve( toReturn );
		} catch ( e ) {
			reject( 'Not a valid json:' + toParse );
		}
	} );
};

export const sendRequest = ( payload ): Promise<request.RequestResponse> => {
	return new Promise( ( resolve, reject ) => {
		request( payload, ( err, response: request.RequestResponse ) => {
			if ( err ) {
				reject( err );
			} else {
				resolve( response );
			}
		} );
	} );
};
