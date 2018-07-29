import { Pool } from 'mysql';
import * as jwt from 'jsonwebtoken';
import { Request, Response } from 'express';
import * as crypto from 'crypto';
import { SystemConfig } from 'shared/models/systemconfig';

export class MainTools {
	// config: any;
	private encryptionAlgorithm = 'AES-256-CBC';
	private iv_length = 16;
	private encryptionKey: string;

	constructor( public db: Pool, public config: SystemConfig ) {
		this.encryptionKey = this.config.hash.substr( 0, 32 );
		console.log( 'Main tools initiated @ tools.main.ts' );
	}

	public htmlEncode = ( str: string ): string => {
		return String( str ).replace( /&/g, '&amp;' ).replace( /</g, '&lt;' ).replace( />/g, '&gt;' ).replace( /"/g, '&quot;' );
	}

	public generateLongString = ( sentLength?: number ): string => {
		const length: number = sentLength || 128;
		const charset = 'abcdefghijklnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789()$^!_%|';
		const n = charset.length;
		let retVal = '';
		for ( let i = 0; i < length; i++ ) {
			retVal += charset.charAt( Math.floor( Math.random() * n ) );
		}
		return retVal;
	}

	public getFormattedDateTime = ( theDate?: Date ) => {
		const curDate = theDate || new Date();
		let toReturn: string; toReturn = '';
		toReturn += curDate.getFullYear();
		toReturn += '-';
		toReturn += ( '0' + ( curDate.getMonth() + 1 ).toString() ).substr( -2 );
		toReturn += '-';
		toReturn += ( '0' + curDate.getDate().toString() ).substr( -2 );
		toReturn += ' ';
		toReturn += ( '0' + curDate.getHours().toString() ).substr( -2 );
		toReturn += '-';
		toReturn += ( '0' + curDate.getMinutes().toString() ).substr( -2 );
		toReturn += '-';
		toReturn += ( '0' + curDate.getSeconds().toString() ).substr( -2 );
		return toReturn;
	}

	public parseJsonString( toParse: string ) {
		return new Promise( ( resolve, reject ) => {
			try {
				const toReturn = JSON.parse( toParse );
				resolve( toReturn );
			} catch ( e ) {
				reject( 'Not a valid json:' + toParse );
			}
		} );
	}

	public jsonParseIf( payload: string ) {
		if ( payload ) {
			return JSON.parse( payload );
		} else {
			return {};
		}
	}
	public jsonStringifyIf( payload: any ) {
		if ( payload ) {
			return JSON.stringify( payload );
		} else {
			return '{}';
		}
	}

	public isEmptyObject = ( refObj: any ) => {
		return Object.keys( refObj ).length === 0;
	}

	public encryptText = ( plaintext: string ): string => {
		const iv = crypto.randomBytes( this.iv_length );
		const cipher = crypto.createCipheriv( this.encryptionAlgorithm, new Buffer( this.encryptionKey ), iv );
		let encrypted = cipher.update( new Buffer( plaintext, 'utf-8' ) );
		encrypted = Buffer.concat( [encrypted, cipher.final()] );

		return iv.toString( 'hex' ) + ':' + encrypted.toString( 'hex' );
	}

	public decryptText = ( ciphertext: string ): string => {
		const textParts = ciphertext.split( ':' );
		const iv = new Buffer( textParts.shift() || '', 'hex' );
		const encryptedText = new Buffer( textParts.join( ':' ), 'hex' );
		const decipher = crypto.createDecipheriv( this.encryptionAlgorithm, new Buffer( this.encryptionKey ), iv );
		let decrypted = decipher.update( encryptedText );
		decrypted = Buffer.concat( [decrypted, decipher.final()] );
		return decrypted.toString( 'utf-8' );
	}

	public encryptTextOLDDONOTUSE = ( plaintext: string ) => {
		// console.log('-------- Encrypt Start ----------------');
		// console.log('Hash:', this.config.hash);
		// console.log('PlTx:', plaintext);
		const cipher = crypto.createCipher( 'aes-256-ctr', this.config.hash );
		let crypted = cipher.update( plaintext, 'utf8', 'hex' );
		crypted += cipher.final( 'hex' );
		// console.log('CrTx:', crypted);
		// console.log('-------- Encrypt End   ----------------');
		return crypted;
	}

	public decryptTextOLDDONOTUSE = ( crypted: string ) => {
		const decipher = crypto.createDecipher( 'aes-256-ctr', this.config.hash );
		let plaintext = decipher.update( crypted, 'hex', 'utf8' );
		plaintext += decipher.final( 'utf8' );
		return plaintext;
	}

	signaToken( toSign: any ): string {
		return jwt.sign( toSign, this.config.hash, { expiresIn: 60 * 60 * 24 * 30 } );
	}

	signToken( toSign: any ): string {
		return jwt.sign( Object.assign( {}, toSign ), this.config.hash, { expiresIn: 60 * 60 * 24 * 5 } );
		// return jwt.sign( Object.assign( {}, toSign ), this.config.hash, { expiresIn: 60 * 2.5 * 1 * 1 } );
	}
	verifyToken = ( payload ) => {
		return new Promise( ( resolve, reject ) => {
			jwt.verify( payload, this.config.hash, ( err, decoded ) => {
				if ( err ) {
					reject( err );
				} else {
					resolve( decoded );
				}
			} );
		} );
	}
}
