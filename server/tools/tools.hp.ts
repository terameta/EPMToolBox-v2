import { SmartViewTool } from './tools.smartview';
import { DB } from './tools.db';
import { MainTools } from './tools.main';
import { ATEnvironmentDetail } from 'shared/models/at.environment';
import { ATStreamField } from 'shared/models/at.stream';

export class HPTool {
	smartview: SmartViewTool;

	constructor( public db: DB, public tools: MainTools ) {
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
	public writeData = ( refObj ) => this.smartview.writeData( refObj );
	public readData = ( refObj ) => this.smartview.readData( refObj );
	public runProcedure = ( refObj ) => this.smartview.runBusinessRule( refObj );
}
