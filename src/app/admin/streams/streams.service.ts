import { Injectable } from '@angular/core';
import { CentralStatusService } from '../../central-status/central-status.service';
import { CommunicationService } from '../../communication/communication.service';
import { Router } from '@angular/router';
import { ATStream } from 'shared/models/at.stream';
import { JSONDeepCopy } from '../../../../shared/utilities/utilityFunctions';
import { EnvironmentsService } from '../environments/environments.service';
import { AdminSharedService } from '../admin-shared/admin-shared.service';

@Injectable( {
	providedIn: 'root'
} )
export class StreamsService {
	public framework = 'streams';

	constructor(
		private ss: CentralStatusService,
		private cs: CommunicationService,
		private gss: AdminSharedService,
		private router: Router
	) { }


	public fieldsStartOver = async ( stream: ATStream ) => {
		const sure = await this.ss.confirm( 'Are you sure to delete all the assigned fields?' );
		if ( sure ) {
			stream.fieldList = [];
			this.gss.update( this.framework, stream );
		}
	}

	public cloneExport = () => {

	}

	public deleteExport = () => {

	}
}

/*

@Injectable()
export class DimeStreamService {

	public prepareTables = () => {
		this.store.dispatch( DimeStreamActions.ONE.preparetables( this.currentItem.id ) );
	}

	public navigateTo = ( id: number ) => {
		delete this.currentItem.fieldList;
		this.router.navigateByUrl( this.router.routerState.snapshot.url
			.split( '/' )
			.map( ( curPart, curIndex ) => ( curIndex === 4 ? id : curPart ) )	// This part replaces the stream ID to the target stream's ID
			.filter( ( curPart, curIndex ) => ( curIndex < 6 ) )						// If we are at the field descriptions part, this will take us to parent and companent will handle redirecting
			.join( '/' )
		);
	}

	public doWeHaveDescribedFields = () => {
		if ( !this.currentItem ) {
			return false;
		} else if ( !this.currentItem.fieldList ) {
			return false;
		} else if ( this.currentItem.fieldList.length === 0 ) {
			return false;
		} else {
			return this.currentItem.fieldList.map( currentField => parseInt( ( currentField.isDescribed ? '1' : '0' ), 10 ) ).reduce( ( accumulator, currentItem ) => accumulator + currentItem ) > 0;
		}
	}

	public refreshDatabases = () => {
		if ( !this.currentItemClean ) {
			this.toastr.error( 'Please save your changes before refreshing database list' );
			return false;
		}
		this.environmentService.listDatabases( this.currentItem.environment ).subscribe(
			( result: { name: string }[] ) => {
				this.toastr.info( 'Database list is updated', this.serviceName );
				this.store.dispatch( DimeStreamActions.ONE.DATABASELIST.set( result ) );
			}, ( error ) => {
				this.toastr.error( 'Failed to refresh databases.', this.serviceName );
				console.error( error );
			}
		);
	}

	public refreshTables = () => {
		if ( !this.currentItemClean ) {
			this.toastr.error( 'Please save your changes before refreshing the table list' );
			return false;
		}
		this.environmentService.listTables( this.currentItem.environment, this.currentItem.dbName ).subscribe(
			( result: { name: string, type: string }[] ) => {
				this.toastr.info( 'Table list is updated.', this.serviceName );
				this.store.dispatch( DimeStreamActions.ONE.TABLELIST.set( result ) );
			}, ( error ) => {
				this.toastr.error( 'Failed to refresh databases.', this.serviceName );
				console.error( error );
			}
		);
	}

	public assignCustomQuery = () => {
		this.currentItem.tableName = 'Custom Query';
		this.markDirty();
		this.update();
	}

	public fieldsListFromSourceEnvironment = ( id: number ) => {
		this.store.dispatch( DimeStreamActions.ONE.FIELDS.LIST.FROMSOURCEENVIRONMENT.initiate( id ) );
	}



	public fieldMove = ( theFieldList: any[], theField, direction ) => {
		const curOrder = theField.position;
		const nextOrder = parseInt( curOrder, 10 ) + ( direction === 'down' ? 1 : -1 );
		theFieldList.forEach( ( curField ) => {
			if ( parseInt( curField.position, 10 ) === nextOrder ) { curField.position = curOrder; }
		} );
		theField.position = nextOrder;
		theFieldList.sort( SortByPosition );
	}

	public isRDBT = () => this.currentItem.type === DimeStreamType.RDBT;
	public isHPDB = () => this.currentItem.type === DimeStreamType.HPDB;

	public fieldRefreshTables = ( field: DimeStreamFieldDetail ) => {
		if ( !field.descriptiveDB ) {
			this.toastr.error( 'Please assign a database to the field description before refreshing the table list' );
			return false;
		}
		this.environmentService.listDescriptiveTables( this.currentItem.environment, field.descriptiveDB, this.currentItem.tableName ).subscribe(
			( result: any[] ) => {
				this.toastr.info( 'Table list is updated' );
				field.descriptiveTableList = result;
				if ( !field.descriptiveTable && result && result.length > 0 ) { field.descriptiveTable = result[0].name; }
			}, ( error ) => {
				this.toastr.error( 'Failed to refresh table list.', this.serviceName );
				console.log( error );
			}
		);
	}

	public fieldListDescriptiveFields = ( field: DimeStreamFieldDetail ) => {
		this.backend.listFieldsforField( { environmentID: this.currentItem.environment, field } ).subscribe( result => {
			this.toastr.info( 'Descriptive fields are refreshed from the server for ' + field.name, this.serviceName );
			field.descriptiveFieldList = result;
		}, error => {
			this.toastr.error( 'Failed to refresh descriptive fields.', this.serviceName );
			console.error( 'fieldListDescriptiveFields:', error );
		} );
	}
	public fetchFieldDescriptions = ( stream: number, field: number ) => {
		return this.backend.fetchFieldDescriptions( { stream, field } );
	}
	public getFieldDescriptionsWithHierarchy = ( stream: number, field: number ) => this.backend.getFieldDescriptionsWithHierarchy( { stream, field } );

	public populateFieldDescriptions = () => {
		this.toastr.info( 'Please wait, refreshing the field descriptions from the source system', this.serviceName );
		this.backend.populateFieldDescriptions( this.currentItem.id ).subscribe( result => {
			this.toastr.info( 'Field descriptions are successfully pulled from the source system.', this.serviceName );
		}, error => {
			this.toastr.error( 'Failed to populate field descriptions.', this.serviceName );
			console.error( 'Populate Field Descriptions' );
			console.error( error );
		} );
	}

}

*/
