import { DB } from '../tools/tools.db';
import { MainTools } from '../tools/tools.main';
import { Socket } from 'socket.io';
import { AuthTool } from '../tools/tools.auth';
import { ATApiCommunication } from '../../shared/models/at.socketrequest';
import { EnvironmentTool } from '../tools/tools.environment';
import { StreamTool } from '../tools/tools.stream';
import { MapTool } from '../tools/tools.map';
import { MatrixTool } from '../tools/tools.matrix';
import { ScheduleTool } from '../tools/tools.schedule';
import { ProcessTool } from '../tools/tools.process';
import { SettingsTool } from '../tools/tools.settings';
import { SecretTool } from '../tools/tools.secrets';
import { CredentialTool } from '../tools/tools.credential';
import { TagTool } from '../tools/tools.tag';
import { TagGroupTool } from '../tools/tools.taggroup';
import { UserTool } from '../tools/tools.user';



interface Backend {
	auth: AuthTool,
	environments: EnvironmentTool,
	streams: StreamTool,
	maps: MapTool,
	matrices: MatrixTool,
	schedules: ScheduleTool,
	processes: ProcessTool,
	settings: SettingsTool,
	secrets: SecretTool,
	credentials: CredentialTool,
	tags: TagTool,
	taggroups: TagGroupTool,
	users: UserTool
}


export class ATApi {
	private backend: Backend = <Backend>{};

	constructor(
		private db: DB,
		private tools: MainTools
	) {
		this.backend.auth = new AuthTool( db, tools );
		this.backend.environments = new EnvironmentTool( db, tools );
		this.backend.streams = new StreamTool( db, tools );
		this.backend.maps = new MapTool( db, tools );
		this.backend.matrices = new MatrixTool( db, tools );
		this.backend.schedules = new ScheduleTool( db, tools );
		this.backend.processes = new ProcessTool( db, tools );
		this.backend.settings = new SettingsTool( db, tools );
		this.backend.secrets = new SecretTool( db, tools );
		this.backend.credentials = new CredentialTool( db, tools );
		this.backend.tags = new TagTool( db, tools );
		this.backend.taggroups = new TagGroupTool( db, tools );
		this.backend.users = new UserTool( db, tools );
	}

	public respond = async ( request: ATApiCommunication, socket: Socket ) => {
		// console.log( '===========================================' );
		// console.log( 'We are at respond' );
		// console.log( '===========================================' );
		// console.log( request );
		// console.log( '===========================================' );
		// console.log( '===========================================' );
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
