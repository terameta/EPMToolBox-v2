import { SmartViewTool } from './tools.smartview';
import { DB } from './tools.db';
import { MainTools } from './tools.main';
import { ATEnvironmentDetail } from 'shared/models/at.environment';
import { ATStreamField } from 'shared/models/at.stream';
import { SortByPosition, arrayCartesian } from '../../shared/utilities/utilityFunctions';
import { findMembers, getPBCSReadDataSelections } from '../../shared/utilities/hpUtilities';
import * as Promisers from '../../shared/utilities/promisers';

export class PBCSTool {
	private smartview: SmartViewTool;

	constructor( private db: DB, private tools: MainTools ) {
		this.smartview = new SmartViewTool( this.db, this.tools );
	}

	public verify = ( payload: ATEnvironmentDetail ) => this.smartview.validateSID( payload );
	public listDatabases = ( payload: ATEnvironmentDetail ) => this.smartview.listApplications( payload );
	public listTables = ( payload: ATEnvironmentDetail ) => this.smartview.listCubes( payload );
	public listFields = ( payload: ATEnvironmentDetail ) => this.smartview.listDimensions( payload );
	public listAliasTables = ( payload: ATEnvironmentDetail ) => this.smartview.listAliasTables( payload );
	public getDescriptions = ( payload: ATEnvironmentDetail, field: ATStreamField ) => this.smartview.getDescriptions( payload, field );
	public getDescriptionsWithHierarchy = ( payload: ATEnvironmentDetail, field: ATStreamField ) => this.smartview.getDescriptionsWithHierarchy( payload, field );
	public listProcedures = ( payload: ATEnvironmentDetail ) => this.smartview.listBusinessRules( payload );
	public listProcedureDetails = ( payload: ATEnvironmentDetail ) => this.smartview.listBusinessRuleDetails( payload );
	public runProcedure = ( payload: ATEnvironmentDetail ) => this.smartview.runBusinessRule( payload );
	public writeData = ( payload ) => this.smartview.writeData( payload );
	public readData = ( payload ) => this.pbcsReadData( payload );
	private pbcsReadData = async ( payload ) => {
		payload.query.hierarchies = await this.smartview.smartviewGetAllDescriptionsWithHierarchy( payload, Object.values( <ATStreamField[]>payload.query.dimensions ).sort( SortByPosition ) );
		await this.pbcsInitiateRest( payload );
		payload.data = [];
		const rows = JSON.parse( JSON.stringify( payload.query.rows ) );
		while ( rows.length > 0 ) {
			const row = rows.splice( 0, 1 )[0];
			const query = {
				exportPlanningData: false,
				gridDefinition: {
					suppressMissingBlocks: true,
					pov: {
						dimensions: payload.query.povDims.map( dimid => payload.query.dimensions[dimid].name ),
						members: payload.query.povs.map( pov => [getPBCSReadDataSelections( pov )] )
					},
					columns: payload.query.cols.map( col => {
						return {
							dimensions: payload.query.colDims.map( dimid => payload.query.dimensions[dimid].name ),
							members: col.map( c => [getPBCSReadDataSelections( c )] )
						};
					} ),
					rows: [
						{
							dimensions: payload.query.rowDims.map( dimid => payload.query.dimensions[dimid].name ),
							members: row.map( r => [getPBCSReadDataSelections( r )] )
						}
					]
				}
			};
			const result = await this.pbcsReadDataAction( payload, query );
			if ( Array.isArray( result ) ) {
				result.forEach( r => payload.data.push( r ) );
			} else {
				let minIndex = -1;
				let minNumberofMembers = 999999999;
				row.forEach( ( selection, dimindex ) => {
					selection.memberList = findMembers( payload.query.hierarchies[payload.query.rowDims[dimindex]], selection.selectionType, selection.selectedMember );
					selection.memberCount = selection.memberList.length;
					if ( selection.memberCount > 1 && selection.memberCount < minNumberofMembers ) {
						minNumberofMembers = selection.memberCount;
						minIndex = dimindex;
					}
				} );
				const membersToExpand = JSON.parse( JSON.stringify( row[minIndex].memberList ) );
				membersToExpand.forEach( ( currentMember, spliceIndex ) => {
					const toPush = JSON.parse( JSON.stringify( row ) );
					toPush[minIndex] = { selectedMember: currentMember.RefField, selectionType: 'member' };
					rows.splice( spliceIndex, 0, toPush );
				} );
			}
		}

		const colCartesian = payload.query.cols.map( col => {
			return arrayCartesian( col.map( ( selection, sindex ) => {
				return findMembers( payload.query.hierarchies[payload.query.colDims[sindex]], selection.selectionType, selection.selectedMember );
			} ) );
		} );
		payload.query.colMembers = [];
		colCartesian.forEach( cm => {
			payload.query.colMembers = payload.query.colMembers.concat( cm );
		} );

		payload.query.povMembers = payload.query.povs.map( ( pov, pindex ) => findMembers( payload.query.hierarchies[payload.query.povDims[pindex]], pov.selectionType, pov.selectedMember ) );
		return payload;
	}
	private pbcsReadDataAction = async ( payload: ATEnvironmentDetail, pbcsQuery: any ): Promise<any> => {
		await this.pbcsInitiateRest( payload );
		const dataURL = payload.pbcs.resturl + '/applications/' + payload.database + '/plantypes/' + payload.table + '/exportdataslice';
		const result = await this.pbcsSendRequest( { method: 'POST', url: dataURL, domain: payload.identitydomain, user: payload.username, pass: payload.password, body: pbcsQuery } );
		if ( result.body && result.body.detail === 'Unable to load the data entry form as the number of data entry cells exceeded the threshold.' ) {
			return false;
		}
		return result.body.rows;
	}
	private pbcsInitiateRest = async ( payload: ATEnvironmentDetail ) => {
		if ( !payload.pbcs.restInitiated ) {
			// payload = await this.pbcsStaticVerify( payload );
			await this.pbcsStaticVerify( payload );
			payload.pbcs.resturl = await this.pbcsGetVersion( payload );
			payload.pbcs.restInitiated = true;
		}
		return payload;
	}
	private pbcsGetVersion = async ( payload: ATEnvironmentDetail ) => {
		const result = await this.pbcsSendRequest( { method: 'GET', url: payload.pbcs.resturl, domain: payload.identitydomain, user: payload.username, pass: payload.password } );
		const linkObject = result.body.links.find( e => e.rel === 'current' );
		if ( linkObject && linkObject.href ) {
			return linkObject.href;
		} else {
			throw new Error( 'Rest API link is not accessible@pbcsGetVersion' );
		}
	}
	private pbcsSendRequest = async ( payload: { method: 'GET' | 'POST', url: string, domain: string, user: string, pass: string, body?: string } ) => {
		const options: any = {};
		options.method = payload.method;
		options.url = payload.url;
		options.json = true;
		if ( payload.body ) options.json = payload.body;

		options.auth = {
			user: payload.domain + '.' + payload.user,
			pass: payload.pass,
			sendImmediately: true
		};
		const result = await Promisers.sendRequest( options );
		return result;
	}
	private pbcsStaticVerify = async ( payload: ATEnvironmentDetail ) => {
		if ( !payload ) {
			throw new Error( 'No data provided' );
		} else if ( !payload.username ) {
			throw new Error( 'No username provided' );
		} else if ( !payload.password ) {
			throw new Error( 'No password provided' );
		} else if ( !payload.server ) {
			throw new Error( 'No server is provided' );
		} else if ( !payload.port ) {
			throw new Error( 'No port is provided' );
		} else if ( !payload.identitydomain ) {
			throw new Error( 'No domain is provided' );
		} else if ( payload.server.substr( 0, 4 ) !== 'http' ) {
			throw new Error( 'Server address is not valid. Make sure it starts with http:// or https://' );
		} else {
			payload.pbcs = <any>{};
			payload.pbcs.address = payload.server + ':' + payload.port;
			payload.pbcs.resturl = payload.pbcs.address + '/HyperionPlanning/rest/';
			payload.pbcs.smartviewurl = payload.pbcs.address + '/workspace/SmartViewProviders';
			return payload;
		}
	}
}
