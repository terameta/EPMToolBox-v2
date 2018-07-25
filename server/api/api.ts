import { DB } from '../tools/tools.db';
import { MainTools } from '../tools/tools.main';
import { Socket } from 'socket.io';
import { AuthTool } from '../tools/tools.auth';
import { ATApiCommunication } from '../../shared/models/at.socketrequest';



interface Backend {
	auth: AuthTool
}


export class ATApi {
	private backend: Backend = <Backend>{};

	constructor(
		private db: DB,
		private tools: MainTools
	) {
		this.backend.auth = new AuthTool( db, tools );
	}

	public respond = async ( request: ATApiCommunication, socket: Socket ) => {
		console.log( '===========================================' );
		console.log( 'We are at respond' );
		console.log( '===========================================' );
		console.log( request );
		console.log( '===========================================' );
		console.log( '===========================================' );
		const payload = await this.backend[request.framework][request.action]( request.payload ).catch( e => this.respondFinalize( request, socket, 'error', e ) );
		if ( payload ) this.respondFinalize( request, socket, 'success', payload );
	}

	private respondFinalize = ( request: ATApiCommunication, socket: Socket, status: 'success' | 'error', data: any ) => {
		// console.log( '===========================================' );
		// console.log( 'We are at respond finalize' );
		// console.log( '===========================================' );
		// console.log( { ...request, payload: { status, data } } );
		// console.log( '===========================================' );
		// console.log( '===========================================' );
		socket.emit( 'communication', { ...request, payload: { status, data } } );
	}
}
