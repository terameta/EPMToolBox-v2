import { SystemConfig } from '../../shared/models/systemconfig';
import { InitiatorUtils } from './config.initiator.utils';
import { MainTools } from '../tools/tools.main';
import { DB } from '../tools/tools.db';
import * as tableDefinitions from './config.initiator.tabledefinitions';
import { EnumToArray } from '../../shared/utilities/utilityFunctions';
import { DimeEnvironmentType } from '../../shared/enums/environmenttypes';
import * as _ from 'lodash';
import { ATEnvironment } from '../../shared/models/at.environment';
import { ATCredential } from '../../shared/models/at.credential';
import { ATSetting } from '../../shared/models/at.setting';
import { ATStreamType } from '../../shared/models/at.streamtypes';
import { ATProcessStepType } from '../../shared/models/at.process';

interface InitiatorStep { expectedCurrentVersion: number, operatorFunction: any, shouldSetVersion?: boolean }

export class Initiator {
	private utils: InitiatorUtils;
	private tools: MainTools;


	private steps: InitiatorStep[] = [];

	constructor(
		private db: DB,
		private configuration: SystemConfig
	) {
		this.utils = new InitiatorUtils( this.db.pool, this.configuration );
		this.tools = new MainTools( this.db.pool, this.configuration );
		this.prepareSteps();
	}

	private prepareSteps = () => {
		this.steps.push( {
			expectedCurrentVersion: -1,
			operatorFunction: () => this.utils.doWeHaveTable( 'currentversion' ),
			shouldSetVersion: false
		} );
		this.steps.push( {
			expectedCurrentVersion: -1,
			operatorFunction: async ( doWeHaveTable: number ) => {
				if ( doWeHaveTable === 0 ) {
					await this.db.query( 'CREATE TABLE currentversion ( version SMALLINT UNSIGNED NULL)' );
				}
				return doWeHaveTable;
			},
			shouldSetVersion: false
		} );
		this.steps.push( {
			expectedCurrentVersion: -1,
			operatorFunction: async ( doWeHaveTable: number ) => {
				if ( doWeHaveTable === 0 ) {
					await this.db.query( 'INSERT INTO currentversion (version) VALUES (0)' );
				}
				return doWeHaveTable;
			},
			shouldSetVersion: false
		} );
		this.steps.push( {
			expectedCurrentVersion: -1,
			operatorFunction: async () => {
				let currentVersion = 0;
				const resultSet = await this.db.query<{ version: number }>( 'SELECT version FROM currentversion' );
				resultSet.result.map( tuple => currentVersion = tuple.version );
				return currentVersion;
			},
			shouldSetVersion: true
		} );
		this.steps.push( { expectedCurrentVersion: 0, operatorFunction: () => this.utils.checkAndCreateTable( tableDefinitions.users ) } );
		this.steps.push( { expectedCurrentVersion: 1, operatorFunction: () => this.utils.checkAndCreateTable( tableDefinitions.environmenttypes ) } );
		this.steps.push( { expectedCurrentVersion: 2, operatorFunction: () => this.utils.checkAndCreateTable( tableDefinitions.environments ) } );
		this.steps.push( { expectedCurrentVersion: 3, operatorFunction: () => this.utils.checkAndCreateTable( tableDefinitions.streams ) } );
		this.steps.push( { expectedCurrentVersion: 4, operatorFunction: () => this.utils.checkAndCreateTable( tableDefinitions.streamtypes ) } );
		this.steps.push( { expectedCurrentVersion: 5, operatorFunction: () => this.utils.checkAndCreateTable( tableDefinitions.streamfields ) } );
		this.steps.push( { expectedCurrentVersion: 6, operatorFunction: () => this.utils.checkAndCreateTable( tableDefinitions.streampreprocesses ) } );
		this.steps.push( { expectedCurrentVersion: 7, operatorFunction: () => this.utils.checkAndCreateTable( tableDefinitions.maps ) } );
		this.steps.push( { expectedCurrentVersion: 8, operatorFunction: () => this.utils.checkAndCreateTable( tableDefinitions.maptypes ) } );
		this.steps.push( { expectedCurrentVersion: 9, operatorFunction: () => this.utils.checkAndCreateTable( tableDefinitions.mapfields ) } );
		this.steps.push( { expectedCurrentVersion: 10, operatorFunction: () => this.utils.checkAndCreateTable( tableDefinitions.logs ) } );
		this.steps.push( { expectedCurrentVersion: 11, operatorFunction: () => this.utils.checkAndCreateTable( tableDefinitions.processes ) } );
		this.steps.push( { expectedCurrentVersion: 12, operatorFunction: () => this.utils.checkAndCreateTable( tableDefinitions.processsteps ) } );
		this.steps.push( { expectedCurrentVersion: 13, operatorFunction: () => this.utils.checkAndCreateTable( tableDefinitions.processdefaulttargets ) } );
		this.steps.push( { expectedCurrentVersion: 14, operatorFunction: () => this.utils.checkAndCreateTable( tableDefinitions.processfilters ) } );
		this.steps.push( { expectedCurrentVersion: 15, operatorFunction: () => this.utils.checkAndCreateTable( tableDefinitions.processfiltersdatafile ) } );
		this.steps.push( { expectedCurrentVersion: 16, operatorFunction: () => this.utils.checkAndCreateTable( tableDefinitions.settings ) } );
		this.steps.push( { expectedCurrentVersion: 17, operatorFunction: () => this.utils.checkAndCreateTable( tableDefinitions.ldapservers ) } );
		this.steps.push( { expectedCurrentVersion: 18, operatorFunction: () => this.utils.checkAndCreateTable( tableDefinitions.secrets ) } );
		this.steps.push( { expectedCurrentVersion: 19, operatorFunction: () => this.utils.checkAndCreateTable( tableDefinitions.processsteptypes ) } );
		this.steps.push( { expectedCurrentVersion: 20, operatorFunction: () => this.utils.checkAndCreateTable( tableDefinitions.acmservers ) } );
		this.steps.push( { expectedCurrentVersion: 21, operatorFunction: () => this.utils.checkAndCreateTable( tableDefinitions.matrices ) } );
		this.steps.push( { expectedCurrentVersion: 22, operatorFunction: () => this.utils.checkAndCreateTable( tableDefinitions.matrixfields ) } );
		this.steps.push( { expectedCurrentVersion: 23, operatorFunction: () => this.utils.checkAndCreateTable( tableDefinitions.userdimeprocesses ) } );
		this.steps.push( { expectedCurrentVersion: 24, operatorFunction: () => this.utils.checkAndCreateTable( tableDefinitions.schedules ) } );
		this.steps.push( { expectedCurrentVersion: 25, operatorFunction: () => this.utils.checkAndCreateTable( tableDefinitions.asyncprocesses ) } );
		this.steps.push( { expectedCurrentVersion: 26, operatorFunction: () => this.db.query( 'ALTER TABLE environments MODIFY password VARCHAR(4096)' ) } );
		this.steps.push( { expectedCurrentVersion: 27, operatorFunction: () => this.utils.tableAddColumn( 'streamfields', 'shouldIgnore TINYINT NULL DEFAULT 0 AFTER fOrder' ) } );
		this.steps.push( { expectedCurrentVersion: 28, operatorFunction: () => this.utils.tableAddColumn( 'streamfields', 'shouldIgnoreCrossTab TINYINT NULL DEFAULT 0 AFTER fOrder' ) } );
		this.steps.push( { expectedCurrentVersion: 29, operatorFunction: () => this.utils.tableAddColumn( 'streamfields', 'isCrossTabFilter TINYINT NULL DEFAULT 0 AFTER shouldIgnoreCrossTab' ) } );
		this.steps.push( { expectedCurrentVersion: 30, operatorFunction: () => this.utils.tableAddColumn( 'streamfields', 'generation2members VARCHAR(4096) DEFAULT \'\' AFTER `ddfDateFormat`' ) } );
		this.steps.push( { expectedCurrentVersion: 31, operatorFunction: () => this.utils.tableAddColumn( 'logs', 'reftype VARCHAR(256) NOT NULL AFTER `details`' ) } );
		this.steps.push( { expectedCurrentVersion: 32, operatorFunction: () => this.utils.tableAddColumn( 'processes', 'erroremail VARCHAR(1024) NULL DEFAULT \'\' AFTER `status`' ) } );
		this.steps.push( { expectedCurrentVersion: 33, operatorFunction: () => this.utils.tableAddColumn( 'logs', 'refid BIGINT UNSIGNED NOT NULL DEFAULT 0 AFTER details' ) } );
		this.steps.push( { expectedCurrentVersion: 34, operatorFunction: () => this.db.query( 'ALTER TABLE `logs` CHANGE `details` `details` LONGBLOB NULL DEFAULT NULL' ) } );
		this.steps.push( { expectedCurrentVersion: 35, operatorFunction: () => this.db.query( 'ALTER TABLE matrices CHANGE map stream BIGINT UNSIGNED NOT NULL DEFAULT 0' ) } );
		this.steps.push( { expectedCurrentVersion: 36, operatorFunction: () => this.utils.checkAndCreateTable( tableDefinitions.credentials ) } );
		this.steps.push( { expectedCurrentVersion: 37, operatorFunction: () => this.utils.checkAndCreateTable( tableDefinitions.tags ) } );
		this.steps.push( { expectedCurrentVersion: 38, operatorFunction: () => this.utils.checkAndCreateTable( tableDefinitions.taggroups ) } );
		this.steps.push( { expectedCurrentVersion: 39, operatorFunction: () => this.utils.tableAddColumn( 'credentials', 'tags VARCHAR(4096) NULL AFTER password' ) } );
		this.steps.push( { expectedCurrentVersion: 40, operatorFunction: () => this.utils.tableAddColumn( 'environments', 'isconverted TINYINT NOT NULL DEFAULT 0 AFTER password' ) } );
		this.steps.push( {
			expectedCurrentVersion: 41, operatorFunction: async () => {
				const environmentTypeObject = _.keyBy( EnumToArray( DimeEnvironmentType ), 'label' );
				const environmentResult = await this.db.query<any>( 'SELECT * FROM environments WHERE isconverted = 0' );
				const environmentList = environmentResult.result;
				const typeResult = await this.db.query<any>( 'SELECT * FROM environmenttypes' );
				const typesObject = _.keyBy( typeResult.result, 'id' );
				for ( const curEnvironment of environmentList ) {
					curEnvironment.type = environmentTypeObject[typesObject[curEnvironment.type].value].value;
					curEnvironment.isconverted = 1;
					await this.db.query( 'UPDATE environments SET ? WHERE id = ?', [curEnvironment, curEnvironment.id] );
				}
			}
		} );
		this.steps.push( { expectedCurrentVersion: 42, operatorFunction: () => this.db.query( 'ALTER TABLE environments DROP isconverted' ) } );
		this.steps.push( { expectedCurrentVersion: 43, operatorFunction: () => this.utils.tableAddColumn( 'environments', 'tags VARCHAR(4096) NULL AFTER password' ) } );
		this.steps.push( { expectedCurrentVersion: 44, operatorFunction: () => this.utils.tableAddColumn( 'environments', 'identitydomain VARCHAR(128) NULL AFTER verified' ) } );
		this.steps.push( { expectedCurrentVersion: 45, operatorFunction: () => this.db.query( 'DROP TABLE environmenttypes' ) } );
		this.steps.push( { expectedCurrentVersion: 46, operatorFunction: () => this.utils.tableAddColumn( 'environments', 'credential BIGINT UNSIGNED NULL AFTER identitydomain' ) } );
		this.steps.push( {
			expectedCurrentVersion: 47, operatorFunction: async () => {
				const environmentResult = await this.db.query<ATEnvironment>( 'SELECT * FROM environments' );
				const environmentList = environmentResult.result;

				for ( const curEnvironment of environmentList ) {

					const credentialToCreate = <ATCredential>{};
					credentialToCreate.name = ( 'FromEnv-' + curEnvironment.id + '-' + curEnvironment.name ).substr( 0, 1000 );
					credentialToCreate.username = ( <any>curEnvironment ).username;
					credentialToCreate.password = this.tools.encryptText( this.tools.decryptTextOLDDONOTUSE( ( <any>curEnvironment ).password ) );
					credentialToCreate.tags = curEnvironment.tags;

					await this.db.query( 'INSERT INTO credentials SET ?', credentialToCreate );
				}
			}
		} );
		this.steps.push( { expectedCurrentVersion: 48, operatorFunction: () => this.db.query( 'ALTER TABLE environments DROP username' ) } );
		this.steps.push( { expectedCurrentVersion: 49, operatorFunction: () => this.db.query( 'ALTER TABLE environments DROP password' ) } );
		this.steps.push( { expectedCurrentVersion: 50, operatorFunction: () => this.utils.tableAddColumn( 'streams', 'tags TEXT NULL AFTER customQuery' ) } );
		this.steps.push( { expectedCurrentVersion: 51, operatorFunction: () => this.db.query( 'ALTER TABLE environments CHANGE tags tags TEXT NULL DEFAULT NULL' ) } );
		this.steps.push( { expectedCurrentVersion: 52, operatorFunction: () => this.db.query( 'ALTER TABLE credentials CHANGE tags tags TEXT NULL DEFAULT NULL' ) } );
		this.steps.push( { expectedCurrentVersion: 53, operatorFunction: () => this.db.query( 'ALTER TABLE streamfields CHANGE fOrder position INT( 10 ) UNSIGNED NULL DEFAULT NULL AFTER type' ) } );
		this.steps.push( { expectedCurrentVersion: 54, operatorFunction: () => this.utils.tableAddColumn( 'environments', 'ssotoken TEXT NULL AFTER credential' ) } );
		this.steps.push( { expectedCurrentVersion: 55, operatorFunction: () => this.db.query( 'ALTER TABLE environments CHANGE ssotoken SID TEXT NULL DEFAULT NULL' ) } );
		this.steps.push( { expectedCurrentVersion: 56, operatorFunction: () => this.utils.tableAddColumn( 'environments', 'cookies TEXT NULL AFTER SID' ) } );
		this.steps.push( { expectedCurrentVersion: 57, operatorFunction: () => this.db.query( 'ALTER TABLE environments DROP SID, DROP cookies' ) } );
		this.steps.push( { expectedCurrentVersion: 58, operatorFunction: () => this.db.query( 'UPDATE processes SET status = 0' ) } );
		this.steps.push( { expectedCurrentVersion: 59, operatorFunction: () => this.db.query( 'ALTER TABLE streamfields DROP shouldIgnore' ) } );
		this.steps.push( { expectedCurrentVersion: 60, operatorFunction: () => this.db.query( 'DROP TABLE matrixfields' ) } );
		this.steps.push( { expectedCurrentVersion: 61, operatorFunction: () => this.utils.tableAddColumn( 'maps', 'tags TEXT NULL AFTER target' ) } );
		this.steps.push( { expectedCurrentVersion: 62, operatorFunction: () => this.utils.tableAddColumn( 'matrices', 'fields TEXT NULL AFTER stream' ) } );
		this.steps.push( { expectedCurrentVersion: 63, operatorFunction: () => this.utils.tableAddColumn( 'matrices', 'tags TEXT NULL AFTER fields' ) } );
		this.steps.push( { expectedCurrentVersion: 64, operatorFunction: () => this.utils.tableAddColumn( 'maps', 'matrix BIGINT UNSIGNED NULL AFTER target' ) } );
		this.steps.push( { expectedCurrentVersion: 65, operatorFunction: () => this.db.query( 'DROP TABLE processsteptypes' ) } );
		this.steps.push( { expectedCurrentVersion: 66, operatorFunction: () => this.db.query( 'ALTER TABLE processsteps CHANGE sOrder position INT( 10 ) UNSIGNED NULL DEFAULT NULL AFTER details' ) } );
		this.steps.push( { expectedCurrentVersion: 67, operatorFunction: () => this.db.query( 'UPDATE processsteps SET type= ? WHERE type = ?', ['transform', 'manipulate'] ) } );
		this.steps.push( { expectedCurrentVersion: 68, operatorFunction: () => this.utils.tableAddColumn( 'processes', 'tags TEXT NULL AFTER erroremail' ) } );
		this.steps.push( { expectedCurrentVersion: 69, operatorFunction: () => this.db.query( 'ALTER TABLE processes CHANGE status status TINYINT NULL DEFAULT 0' ) } );
		this.steps.push( { expectedCurrentVersion: 70, operatorFunction: () => this.utils.tableAddColumn( 'processes', 'currentlog BIGINT UNSIGNED NOT NULL DEFAULT 0 AFTER tags' ) } );
		this.steps.push( {
			expectedCurrentVersion: 71, operatorFunction: async () => {
				const queryResult = await this.db.query<any[]>( 'SELECT * FROM settings WHERE name = \'emailserverhost\'' );
				if ( queryResult.result.length === 0 ) {
					await this.db.query( 'INSERT INTO settings (name, value) VALUES (\'emailserverhost\', \'\')' );
				}
			}
		} );
		this.steps.push( {
			expectedCurrentVersion: 72, operatorFunction: async () => {
				const queryResult = await this.db.query<any[]>( 'SELECT * FROM settings WHERE name = \'emailserverport\'' );
				if ( queryResult.result.length === 0 ) {
					await this.db.query( 'INSERT INTO settings (name, value) VALUES (\'emailserverport\', \'\')' );
				}
			}
		} );
		this.steps.push( {
			expectedCurrentVersion: 73, operatorFunction: async () => {
				const queryResult = await this.db.query<any[]>( 'SELECT * FROM settings WHERE name = \'systemadminemailaddress\'' );
				if ( queryResult.result.length === 0 ) {
					await this.db.query( 'INSERT INTO settings (name, value) VALUES (\'systemadminemailaddress\', \'\')' );
				}
			}
		} );
		this.steps.push( {
			expectedCurrentVersion: 74, operatorFunction: async () => {
				const settingResult = await this.db.query<any>( 'SELECT * FROM settings' );
				const newSetting: ATSetting = <ATSetting>{ host: '', port: 25 };
				const rowsToDelete: number[] = [];

				settingResult.result.forEach( row => {
					if ( row.name === 'emailserverhost' ) {
						newSetting.host = row.value;
						if ( !newSetting.host ) { newSetting.host = ''; }
						rowsToDelete.push( row.id );
					} else if ( row.name === 'emailserverport' ) {
						newSetting.port = parseInt( row.value, 10 );
						if ( !newSetting.port ) { newSetting.port = 25; }
						rowsToDelete.push( row.id );
					}
				} );
				await this.db.query( 'INSERT INTO settings (name, value) VALUES (?, ?)', ['emailserver', JSON.stringify( newSetting )] );
				await this.db.query( 'DELETE FROM settings WHERE id IN (' + rowsToDelete.join( ', ' ) + ')' );
			}
		} );
		this.steps.push( {
			expectedCurrentVersion: 75, operatorFunction: async () => {
				const settingResult = await this.db.query<any>( 'SELECT * FROM settings' );
				const newSetting: ATSetting = <ATSetting>{ emailaddress: '' };
				const rowsToDelete: number[] = [];

				settingResult.result.forEach( row => {
					if ( row.name === 'systemadminemailaddress' ) {
						newSetting.emailaddress = row.value;
						rowsToDelete.push( row.id );
					}
				} );
				await this.db.query( 'INSERT INTO settings (name, value) VALUES (?, ?)', ['systemadmin', JSON.stringify( newSetting )] );
				await this.db.query( 'DELETE FROM settings WHERE id IN (' + rowsToDelete.join( ', ' ) + ')' );
			}
		} );
		this.steps.push( { expectedCurrentVersion: 76, operatorFunction: () => this.db.query( 'ALTER TABLE settings CHANGE value value TEXT NULL DEFAULT NULL' ) } );
		this.steps.push( { expectedCurrentVersion: 77, operatorFunction: () => this.utils.tableAddColumn( 'schedules', 'tags TEXT NULL AFTER status' ) } );
		this.steps.push( { expectedCurrentVersion: 78, operatorFunction: () => this.utils.tableAddColumn( 'streams', 'newtype BIGINT UNSIGNED NOT NULL DEFAULT 0 AFTER type' ) } );
		this.steps.push( {
			expectedCurrentVersion: 79, operatorFunction: async () => {
				const streamTypeResult = await this.db.query<any>( 'SELECT * FROM streamtypes' );
				const types = _.keyBy( streamTypeResult.result, 'value' );
				await this.db.query( 'UPDATE streams SET newtype = ? WHERE type = ?', [ATStreamType.HPDB, types.HPDB.id] );
				await this.db.query( 'UPDATE streams SET newtype = ? WHERE type = ?', [ATStreamType.RDBT, types.RDBT.id] );
				await this.db.query( 'UPDATE streams SET type = newtype' );
			}
		} );
		this.steps.push( { expectedCurrentVersion: 80, operatorFunction: () => this.db.query( 'ALTER TABLE streams DROP newtype' ) } );
		this.steps.push( { expectedCurrentVersion: 81, operatorFunction: () => this.db.query( 'DROP TABLE streamtypes' ) } );
		this.steps.push( { expectedCurrentVersion: 82, operatorFunction: () => this.db.query( 'UPDATE streamfields SET isDescribed = 1 WHERE stream IN (SELECT id FROM streams WHERE type = ?)', ATStreamType.HPDB ) } );
		this.steps.push( {
			expectedCurrentVersion: 83, operatorFunction: async () => {
				const stepList = await this.db.query<any>( 'SELECT * FROM processsteps WHERE type = ?', ATProcessStepType.TargetProcedure );
				for ( const row of stepList.result ) {
					if ( row.details ) {
						row.details = JSON.parse( row.details.toString() );
						if ( row.details.type === 'Rules' ) {
							row.details.type = 'graphical';
							row.details = JSON.stringify( row.details );
							await this.db.query( 'UPDATE processsteps SET details = ? WHERE id = ?', [row.details, row.id] );
						}
					}
				}
			}
		} );
		// Look at the old version of to0085 to fix below
		this.steps.push( { expectedCurrentVersion: 84, operatorFunction: async () => ( true ) } );
		this.steps.push( { expectedCurrentVersion: 85, operatorFunction: () => this.db.query( 'ALTER TABLE processsteps CHANGE details details LONGTEXT NULL DEFAULT NULL' ) } );
		this.steps.push( { expectedCurrentVersion: 86, operatorFunction: () => this.utils.tableAddColumn( 'streams', 'exports TEXT NULL AFTER tags' ) } );
		this.steps.push( { expectedCurrentVersion: 87, operatorFunction: () => this.utils.tableAddColumn( 'users', 'clearance TEXT NULL AFTER surname' ) } );
		this.steps.push( {
			expectedCurrentVersion: 88, operatorFunction: async () => {
				const usersResult = await this.db.query<any>( 'SELECT * FROM users' );
				const users = usersResult.result;
				const assignmentsResult = await this.db.query<any>( 'SELECT * FROM userdimeprocesses' );
				const assignments = assignmentsResult.result;
				for ( const user of users ) {
					if ( !user.clearance ) user.clearance = {};
					user.clearance.processes = assignments.filter( a => a.user === user.id ).map( a => ( { id: a.process } ) );
					await this.db.query( 'UPDATE users SET clearance = ? WHERE id = ?', [JSON.stringify( user.clearance ), user.id] );
				}
			}
		} );
		this.steps.push( { expectedCurrentVersion: 89, operatorFunction: () => this.db.query( 'DROP TABLE userdimeprocesses' ) } );
		this.steps.push( { expectedCurrentVersion: 90, operatorFunction: () => this.db.query( 'ALTER TABLE secrets DROP secret, DROP description, DROP allowedips' ) } );
		this.steps.push( { expectedCurrentVersion: 91, operatorFunction: () => this.utils.tableAddColumn( 'secrets', 'details LONGTEXT NULL AFTER id' ) } );
	}

	public initiate = async () => {

		console.log( '===============================================' );
		console.log( '=== Initiator is now starting               ===' );
		console.log( '===============================================' );

		this.steps.forEach( s => {
			if ( s.shouldSetVersion !== false ) { s.shouldSetVersion = true; }
		} );

		let stepResult: any = null;
		let currentVersion = await this.findCurrentVersion();


		for ( const step of this.steps ) {
			if ( step.expectedCurrentVersion === currentVersion ) {
				stepResult = await step.operatorFunction( stepResult );
				if ( step.shouldSetVersion ) {
					currentVersion++;
					stepResult = await this.utils.updateToVersion( currentVersion );
				}
			}
		}

		console.log( '===============================================' );
		console.log( '=== Database is now at version ' + currentVersion + '         ===' );
		console.log( '===============================================' );
	}

	public findCurrentVersion = async () => {
		let currentVersion = -1;
		const resultSet = await this.db.query<{ version: number }>( 'SELECT version FROM currentversion' );
		resultSet.result.map( tuple => currentVersion = tuple.version );
		return currentVersion;
	}
}


/**
import { ATStatusType } from '../../shared/enums/generic/statustypes';
import { DimeEnvironmentType } from '../../shared/enums/dime/environmenttypes';
import * as bcrypt from 'bcrypt';
import * as _ from 'lodash';
import { Pool } from 'mysql';
import { InitiatorUtils } from './config.initiator.utils';
import { EnumToArray, SortByName } from '../../shared/utilities/utilityFunctions';
import { DimeEnvironment } from '../../shared/model/dime/environment';
import { MainTools } from '../tools/tools.main';
import { DimeCredential } from '../../shared/model/dime/credential';
import { DimeStreamType } from '../../shared/enums/dime/streamtypes';
import { DimeSetting } from '../../shared/model/dime/settings';
import { DimeProcessStepType } from '../../shared/model/dime/process';
import * as util from 'util';
import { AcmUser } from '../../shared/model/accessmanagement/user';

interface TableDefiner {
	name: string;
	fields: Array<string>;
	primaryKey?: string;
	values?: Array<any>;
	fieldsToCheck?: Array<string>;
}

let db: Pool;
let configuration: any;
let tableList: Array<TableDefiner>; tableList = [];
let utils: InitiatorUtils;
let tools: MainTools;

export function initiateInitiator( refDB: Pool, refConf: any ) {
	db = refDB;
	configuration = refConf;
	utils = new InitiatorUtils( db, configuration );
	tools = new MainTools( configuration, db );
	console.log( '===============================================' );
	console.log( '=== Initiator is now starting               ===' );
	console.log( '===============================================' );

	return checkVersion().
		then( to0001 ).then( to0002 ).then( to0003 ).then( to0004 ).then( to0005 ).then( to0006 ).then( to0007 ).then( to0008 ).then( to0009 ).then( to0010 ).then( to0011 ).then( to0012 ).then( to0013 ).then( to0014 ).
		then( to0015 ).then( to0016 ).then( to0017 ).then( to0018 ).then( to0019 ).then( to0020 ).then( to0021 ).then( to0022 ).then( to0023 ).then( to0024 ).then( to0025 ).then( to0026 ).then( to0027 ).then( to0028 ).
		then( to0029 ).then( to0030 ).then( to0031 ).then( to0032 ).then( to0033 ).then( to0034 ).then( to0035 ).then( to0036 ).then( to0037 ).then( to0038 ).then( to0039 ).then( to0040 ).then( to0041 ).then( to0042 ).
		then( to0043 ).then( to0044 ).then( to0045 ).then( to0046 ).then( to0047 ).then( to0048 ).then( to0049 ).then( to0050 ).then( to0051 ).then( to0052 ).then( to0053 ).then( to0054 ).then( to0055 ).then( to0056 ).
		then( to0057 ).then( to0058 ).then( to0059 ).then( to0060 ).then( to0061 ).then( to0062 ).then( to0063 ).then( to0064 ).then( to0065 ).then( to0066 ).then( to0067 ).then( to0068 ).then( to0069 ).then( to0070 ).
		then( to0071 ).then( to0072 ).then( to0073 ).then( to0074 ).then( to0075 ).then( to0076 ).then( to0077 ).then( to0078 ).then( to0079 ).then( to0080 ).then( to0081 ).then( to0082 ).then( to0083 ).then( to0084 ).
		then( to0085 ).then( to0086 ).then( to0087 ).then( to0088 ).then( to0089 ).then( to0090 ).then( to0091 ).then( to0092 ).
		then( ( finalVersion: number ) => {
			const versionToLog = ( '0000' + finalVersion ).substr( -4 );
			console.log( '===============================================' );
			console.log( '=== Database is now at version ' + versionToLog + '         ===' );
			console.log( '===============================================' );
		} ).
		then( clearResidue );
}

const to0092 = async ( currentVersion: number ) => {
	const nextVersion = 92;
	const expectedCurrentVersion = nextVersion - 1;
	if ( currentVersion > expectedCurrentVersion ) {
		return currentVersion;
	} else {
		await utils.tableAddColumn( 'secrets', 'details LONGTEXT NULL AFTER id' );
		return utils.updateToVersion( nextVersion );
	}
};

const to0091 = async ( currentVersion: number ) => {
	const nextVersion = 91;
	const expectedCurrentVersion = nextVersion - 1;
	if ( currentVersion > expectedCurrentVersion ) {
		return currentVersion;
	} else {
		const toWait = new Promise( ( resolve, reject ) => {
			db.query( 'ALTER TABLE secrets DROP secret, DROP description, DROP allowedips', ( err, result ) => {
				if ( err ) {
					reject( err );
				} else {
					resolve();
				}
			} );
		} );
		await toWait;
		return await utils.updateToVersion( nextVersion );
	}
};

const to0090 = async ( currentVersion: number ) => {
	const nextVersion = 90;
	const expectedCurrentVersion = nextVersion - 1;
	if ( currentVersion > expectedCurrentVersion ) {
		return currentVersion;
	} else {
		const toWait = new Promise( ( resolve, reject ) => {
			db.query( 'DROP TABLE userdimeprocesses', ( err, result ) => {
				if ( err ) {
					reject( err );
				} else {
					resolve();
				}
			} );
		} );
		await toWait;
		return await utils.updateToVersion( nextVersion );
	}
};
const to0089 = async ( currentVersion: number ) => {
	const nextVersion = 89;
	const expectedCurrentVersion = nextVersion - 1;
	if ( currentVersion > expectedCurrentVersion ) {
		return currentVersion;
	} else {
		const promises = [];
		const users = await to0089ListUsers();
		const assignments = await to0089ListAccessRights();
		users.forEach( user => {
			// assignments.filter( a => a.user === user.id ).forEach( a => console.log( 'User:', user.id, user.username, '--- Process:', a.process ) );
			if ( !user.clearance ) user.clearance = {};
			user.clearance.processes = assignments.filter( a => a.user === user.id ).map( a => ( { id: a.process } ) );
			promises.push( to0089UpdateUsers( user ) );
		} );
		await Promise.all( promises );
		return await utils.updateToVersion( nextVersion );
	}
};
const to0089UpdateUsers = ( user: AcmUser ): Promise<any> => {
	return new Promise( ( resolve, reject ) => {
		db.query( 'UPDATE users SET clearance = ? WHERE id = ?', [JSON.stringify( user.clearance ), user.id], ( err, result ) => {
			if ( err ) {
				reject( err );
			} else {
				resolve();
			}
		} );
	} );
};
const to0089ListUsers = (): Promise<AcmUser[]> => {
	return new Promise( ( resolve, reject ) => {
		db.query( 'SELECT * FROM users', ( err, users: AcmUser[] ) => {
			if ( err ) {
				reject( err );
			} else {
				resolve( users );
			}
		} );
	} );
};
const to0089ListAccessRights = (): Promise<any[]> => {
	return new Promise( ( resolve, reject ) => {
		db.query( 'SELECT * FROM userdimeprocesses', ( err, users ) => {
			if ( err ) {
				reject( err );
			} else {
				resolve( users );
			}
		} );
	} );
};
const to0088 = ( currentVersion: number ) => {
	return new Promise( ( resolve, reject ) => {
		const nextVersion = 88;
		const expectedCurrentVersion = nextVersion - 1;
		if ( currentVersion > expectedCurrentVersion ) {
			resolve( currentVersion );
		} else {
			utils.tableAddColumn( 'users', 'clearance TEXT NULL AFTER surname' )
				.then( () => {
					resolve( utils.updateToVersion( nextVersion ) );
				} ).catch( reject );
		}
	} );
};
const to0087 = ( currentVersion: number ) => {
	return new Promise( ( resolve, reject ) => {
		const nextVersion = 87;
		const expectedCurrentVersion = nextVersion - 1;
		if ( currentVersion > expectedCurrentVersion ) {
			resolve( currentVersion );
		} else {
			utils.tableAddColumn( 'streams', 'exports TEXT NULL AFTER tags' )
				.then( () => {
					resolve( utils.updateToVersion( nextVersion ) );
				} ).catch( reject );
		}
	} );
};
const to0086 = ( currentVersion: number ) => {
	return new Promise( ( resolve, reject ) => {
		const nextVersion = 86;
		const expectedCurrentVersion = nextVersion - 1;
		if ( currentVersion > expectedCurrentVersion ) {
			resolve( currentVersion );
		} else {
			db.query( 'ALTER TABLE processsteps CHANGE details details LONGTEXT NULL DEFAULT NULL', ( err, result ) => {
				if ( err ) {
					reject( err );
				} else {
					resolve( utils.updateToVersion( nextVersion ) );
				}
			} );
		}
	} );
};
const to0085 = ( currentVersion: number ) => {
	return new Promise( ( resolve, reject ) => {
		const nextVersion = 85;
		const expectedCurrentVersion = nextVersion - 1;
		if ( currentVersion > expectedCurrentVersion ) {
			resolve( currentVersion );
		} else {
			db.query( 'SELECT * FROM processsteps', ( err, rows, fields ) => {
				if ( err ) {
					reject( err );
				} else {
					const promises: any[] = [];
					rows.filter( row => row.type === 'tarprocedure' ).forEach( row => {
						const stepDetails = row.details ? JSON.parse( row.details.toString() ) : {};
						if ( !stepDetails.selectedTable ) {
							rows.filter( r => r.process === row.process && r.type === 'pushdata' ).forEach( r => {
								if ( r.referedid ) promises.push( to0085completeall( r.referedid, row.id, stepDetails ) );
							} );
						}
					} );
					Promise.all( promises ).then( () => {
						resolve( utils.updateToVersion( nextVersion ) );
					} ).catch( reject );
				}
			} );
		}
	} );
};
const to0085completeall = ( streamid: number, stepid: number, details: any ) => {
	return new Promise( ( resolve, reject ) => {
		to0085findTableName( streamid ).
			then( ( tableName: string ) => {
				details.selectedTable = tableName;

				return to0085assignTableName( stepid, JSON.stringify( details ) );
			} ).then( resolve ).catch( reject );
	} );
};
const to0085findTableName = ( streamid: number ) => {
	return new Promise( ( resolve, reject ) => {
		db.query( 'SELECT * FROM streams WHERE id = ?', streamid, ( err, rows, fields ) => {
			if ( err ) {
				reject( err );
			} else if ( rows.length !== 1 ) {
				resolve( streamid.toString() );
			} else {
				resolve( rows[0].tableName );
			}
		} );
	} );
};
const to0085assignTableName = ( id: number, details: string ) => {
	return new Promise( ( resolve, reject ) => {
		db.query( 'UPDATE processsteps SET details = ? WHERE id = ?', [details, id], ( err, result ) => {
			if ( err ) {
				reject( err );
			} else {
				resolve();
			}
		} );
	} );
};
const to0084 = ( currentVersion: number ) => {
	return new Promise( ( resolve, reject ) => {
		const nextVersion = 84;
		const expectedCurrentVersion = nextVersion - 1;
		if ( currentVersion > expectedCurrentVersion ) {
			resolve( currentVersion );
		} else {
			db.query( 'SELECT * FROM processsteps WHERE type = ?', DimeProcessStepType.TargetProcedure, ( err, rows, fields ) => {
				if ( err ) {
					reject( err );
				} else {
					const promises = [];
					rows.forEach( row => {
						if ( row.details ) {
							row.details = JSON.parse( row.details.toString() );
							if ( row.details.type === 'Rules' ) {
								console.log( '>>>We should change' );
								row.details.type = 'graphical';
								row.details = JSON.stringify( row.details );
								promises.push( new Promise( ( iresolve, ireject ) => {
									db.query( 'UPDATE processsteps SET details = ? WHERE id = ?', [row.details, row.id], ( ierr, iresult ) => {
										if ( ierr ) {
											ireject( ierr );
										} else {
											iresolve();
										}
									} );
								} ) );
							}
						}
						console.log( row );
					} );
					Promise.all( promises ).then( () => {
						resolve( utils.updateToVersion( nextVersion ) );
					} ).catch( reject );
				}
			} );
		}
	} );
};
const to0083 = ( currentVersion: number ) => {
	return new Promise( ( resolve, reject ) => {
		const nextVersion = 83;
		const expectedCurrentVersion = nextVersion - 1;
		if ( currentVersion > expectedCurrentVersion ) {
			resolve( currentVersion );
		} else {
			db.query( 'UPDATE streamfields SET isDescribed = 1 WHERE stream IN (SELECT id FROM streams WHERE type = ?)', DimeStreamType.HPDB, ( err, result ) => {
				if ( err ) {
					reject( err );
				} else {
					resolve( utils.updateToVersion( nextVersion ) );
				}
			} );
		}
	} );
};
const to0082 = ( currentVersion: number ) => {
	return new Promise( ( resolve, reject ) => {
		const nextVersion = 82;
		const expectedCurrentVersion = nextVersion - 1;
		if ( currentVersion > expectedCurrentVersion ) {
			resolve( currentVersion );
		} else {
			db.query( 'DROP TABLE streamtypes', ( err, result ) => {
				if ( err ) {
					reject( err );
				} else {
					resolve( utils.updateToVersion( nextVersion ) );
				}
			} );
		}
	} );
};
const to0081 = ( currentVersion: number ) => {
	return new Promise( ( resolve, reject ) => {
		const nextVersion = 81;
		const expectedCurrentVersion = nextVersion - 1;
		if ( currentVersion > expectedCurrentVersion ) {
			resolve( currentVersion );
		} else {
			db.query( 'ALTER TABLE streams DROP newtype', ( err, result ) => {
				if ( err ) {
					reject( err );
				} else {
					resolve( utils.updateToVersion( nextVersion ) );
				}
			} );
		}
	} );
};
const to0080 = ( currentVersion: number ) => {
	return new Promise( ( resolve, reject ) => {
		const nextVersion = 80;
		const expectedCurrentVersion = nextVersion - 1;
		if ( currentVersion > expectedCurrentVersion ) {
			resolve( currentVersion );
		} else {
			db.query( 'SELECT * FROM streamtypes', ( err, rows ) => {
				if ( err ) {
					reject( err );
				} else {
					const types = _.keyBy( rows, 'value' );
					to0080a( types ).then( () => {
						return to0080b( types );
					} ).then( to0080c ).then( () => {
						resolve( utils.updateToVersion( nextVersion ) );
					} ).catch( reject );
				}
			} );
			// db.query( 'UPDATE streams ss LEFT JOIN streamtypes st ON ss.type = st.id SET ss.newtype = ? WHERE st.value = st.value = \'HPDB\'', DimeStreamType.HPDB, ( err, rows ) => {
			// 	if ( err ) {
			// 		reject( err );
			// 	} else {
			// 		console.log( rows );
			// 	}
			// } );
		}
	} );
};
const to0080a = ( types ) => {
	return new Promise( ( resolve, reject ) => {
		db.query( 'UPDATE streams SET newtype = ? WHERE type = ?', [DimeStreamType.HPDB, types.HPDB.id], ( err, result ) => {
			if ( err ) {
				reject( err );
			} else {
				resolve();
			}
		} );
	} );
};
const to0080b = ( types ) => {
	return new Promise( ( resolve, reject ) => {
		db.query( 'UPDATE streams SET newtype = ? WHERE type = ?', [DimeStreamType.RDBT, types.RDBT.id], ( err, result ) => {
			if ( err ) {
				reject( err );
			} else {
				resolve();
			}
		} );
	} );
};
const to0080c = () => {
	return new Promise( ( resolve, reject ) => {
		db.query( 'UPDATE streams SET type = newtype', ( err, result ) => {
			if ( err ) {
				reject( err );
			} else {
				resolve();
			}
		} );
	} );
};
const to0079 = ( currentVersion: number ) => {
	return new Promise( ( resolve, reject ) => {
		const nextVersion = 79;
		const expectedCurrentVersion = nextVersion - 1;
		if ( currentVersion > expectedCurrentVersion ) {
			resolve( currentVersion );
		} else {
			utils.tableAddColumn( 'streams', 'newtype BIGINT UNSIGNED NOT NULL DEFAULT 0 AFTER type' )
				.then( () => {
					resolve( utils.updateToVersion( nextVersion ) );
				} ).catch( reject );
		}
	} );
};
const to0078 = ( currentVersion: number ) => {
	return new Promise( ( resolve, reject ) => {
		const nextVersion = 78;
		const expectedCurrentVersion = nextVersion - 1;
		if ( currentVersion > expectedCurrentVersion ) {
			resolve( currentVersion );
		} else {
			utils.tableAddColumn( 'schedules', 'tags TEXT NULL AFTER status' )
				.then( () => {
					resolve( utils.updateToVersion( nextVersion ) );
				} ).catch( reject );
		}
	} );
};
const to0077 = ( currentVersion: number ) => {
	return new Promise( ( resolve, reject ) => {
		const nextVersion = 77;
		const expectedCurrentVersion = nextVersion - 1;
		if ( currentVersion > expectedCurrentVersion ) {
			resolve( currentVersion );
		} else {
			db.query( 'ALTER TABLE settings CHANGE value value TEXT NULL DEFAULT NULL', ( err, result ) => {
				if ( err ) {
					reject( err );
				} else {
					resolve( utils.updateToVersion( nextVersion ) );
				}
			} );
		}
	} );
};
const to0076 = ( currentVersion: number ) => {
	return new Promise( ( resolve, reject ) => {
		const nextVersion = 76;
		const expectedCurrentVersion = nextVersion - 1;
		if ( currentVersion > expectedCurrentVersion ) {
			resolve( currentVersion );
		} else {
			db.query( 'SELECT * FROM settings', ( err, rows: { id: number, name: string, value: string }[], fields ) => {
				if ( err ) {
					reject( err );
				} else {
					const newSetting: DimeSetting = <DimeSetting>{ emailaddress: '' };
					const rowsToDelete: number[] = [];
					rows.forEach( row => {
						if ( row.name === 'systemadminemailaddress' ) {
							newSetting.emailaddress = row.value;
							rowsToDelete.push( row.id );
						}
					} );
					db.query( 'INSERT INTO settings (name, value) VALUES (?, ?)', ['systemadmin', JSON.stringify( newSetting )], ( err2, result2 ) => {
						if ( err2 ) {
							reject( err2 );
						} else {
							db.query( 'DELETE FROM settings WHERE id IN (' + rowsToDelete.join( ', ' ) + ')', ( err3, result3 ) => {
								if ( err3 ) {
									reject( err3 );
								} else {
									resolve( utils.updateToVersion( nextVersion ) );
								}
							} );
						}
					} );
				}
			} );
		}
	} );
};
const to0075 = ( currentVersion: number ) => {
	return new Promise( ( resolve, reject ) => {
		const nextVersion = 75;
		const expectedCurrentVersion = nextVersion - 1;
		if ( currentVersion > expectedCurrentVersion ) {
			resolve( currentVersion );
		} else {
			db.query( 'SELECT * FROM settings', ( err, rows: { id: number, name: string, value: string }[], fields ) => {
				if ( err ) {
					reject( err );
				} else {
					const newSetting: DimeSetting = <DimeSetting>{ host: '', port: 25 };
					const rowsToDelete: number[] = [];
					rows.forEach( row => {
						if ( row.name === 'emailserverhost' ) {
							newSetting.host = row.value;
							if ( !newSetting.host ) { newSetting.host = ''; }
							rowsToDelete.push( row.id );
						} else if ( row.name === 'emailserverport' ) {
							newSetting.port = parseInt( row.value, 10 );
							if ( !newSetting.port ) { newSetting.port = 25; }
							rowsToDelete.push( row.id );
						}
					} );
					db.query( 'INSERT INTO settings (name, value) VALUES (?, ?)', ['emailserver', JSON.stringify( newSetting )], ( err2, result2 ) => {
						if ( err2 ) {
							reject( err2 );
						} else {
							db.query( 'DELETE FROM settings WHERE id IN (' + rowsToDelete.join( ', ' ) + ')', ( err3, result3 ) => {
								if ( err3 ) {
									reject( err3 );
								} else {
									resolve( utils.updateToVersion( nextVersion ) );
								}
							} );
						}
					} );
				}
			} );
		}
	} );
};
const to0074 = ( currentVersion: number ) => {
	return new Promise( ( resolve, reject ) => {
		const expectedCurrentVersion = 73;
		const nextVersion = expectedCurrentVersion + 1;
		if ( currentVersion > expectedCurrentVersion ) {
			resolve( currentVersion );
		} else {
			db.query( 'SELECT * FROM settings WHERE name = \'systemadminemailaddress\'', ( err, rows ) => {
				if ( err ) {
					reject( err );
				} else {
					if ( rows.length === 0 ) {
						db.query( 'INSERT INTO settings (name, value) VALUES (\'systemadminemailaddress\', \'\')', ( err2, result ) => {
							if ( err2 ) {
								reject( err2 );
							} else {
								resolve( utils.updateToVersion( nextVersion ) );
							}
						} );
					} else {
						resolve( utils.updateToVersion( nextVersion ) );
					}
				}
			} );
		}
	} );
};
const to0073 = ( currentVersion: number ) => {
	return new Promise( ( resolve, reject ) => {
		const expectedCurrentVersion = 72;
		const nextVersion = expectedCurrentVersion + 1;
		if ( currentVersion > expectedCurrentVersion ) {
			resolve( currentVersion );
		} else {
			db.query( 'SELECT * FROM settings WHERE name = \'emailserverport\'', ( err, rows ) => {
				if ( err ) {
					reject( err );
				} else {
					if ( rows.length === 0 ) {
						db.query( 'INSERT INTO settings (name, value) VALUES (\'emailserverport\', \'\')', ( err2, result ) => {
							if ( err2 ) {
								reject( err2 );
							} else {
								resolve( utils.updateToVersion( nextVersion ) );
							}
						} );
					} else {
						resolve( utils.updateToVersion( nextVersion ) );
					}
				}
			} );
		}
	} );
};
const to0072 = ( currentVersion: number ) => {
	return new Promise( ( resolve, reject ) => {
		const expectedCurrentVersion = 71;
		const nextVersion = expectedCurrentVersion + 1;
		if ( currentVersion > expectedCurrentVersion ) {
			resolve( currentVersion );
		} else {
			db.query( 'SELECT * FROM settings WHERE name = \'emailserverhost\'', ( err, rows ) => {
				if ( err ) {
					reject( err );
				} else {
					if ( rows.length === 0 ) {
						db.query( 'INSERT INTO settings (name, value) VALUES (\'emailserverhost\', \'\')', ( err2, result ) => {
							if ( err2 ) {
								reject( err2 );
							} else {
								resolve( utils.updateToVersion( nextVersion ) );
							}
						} );
					} else {
						resolve( utils.updateToVersion( nextVersion ) );
					}
				}
			} );
		}
	} );
};
const to0071 = ( currentVersion: number ) => {
	return new Promise( ( resolve, reject ) => {
		const expectedCurrentVersion = 70;
		const nextVersion = expectedCurrentVersion + 1;
		if ( currentVersion > expectedCurrentVersion ) {
			resolve( currentVersion );
		} else {
			utils.tableAddColumn( 'processes', 'currentlog BIGINT UNSIGNED NOT NULL DEFAULT 0 AFTER tags' )
				.then( () => {
					resolve( utils.updateToVersion( nextVersion ) );
				} ).catch( reject );
		}
	} );
};
const to0070 = ( currentVersion: number ) => {
	return new Promise( ( resolve, reject ) => {
		const expectedCurrentVersion = 69;
		const nextVersion = expectedCurrentVersion + 1;
		if ( currentVersion > expectedCurrentVersion ) {
			resolve( currentVersion );
		} else {
			db.query( 'UPDATE processes SET status = 0', ( ierr, iresults ) => {
				if ( ierr ) {
					reject( ierr );
				} else {
					db.query( 'ALTER TABLE processes CHANGE status status TINYINT NULL DEFAULT 0', ( err, result ) => {
						if ( err ) {
							reject( err );
						} else {
							resolve( utils.updateToVersion( nextVersion ) );
						}
					} );
				}
			} );
		}
	} );
};
const to0069 = ( currentVersion: number ) => {
	return new Promise( ( resolve, reject ) => {
		const expectedCurrentVersion = 68;
		const nextVersion = expectedCurrentVersion + 1;
		if ( currentVersion > expectedCurrentVersion ) {
			resolve( currentVersion );
		} else {
			utils.tableAddColumn( 'processes', 'tags TEXT NULL AFTER erroremail' )
				.then( () => {
					resolve( utils.updateToVersion( nextVersion ) );
				} ).catch( reject );
		}
	} );
};
const to0068 = ( currentVersion: number ) => {
	return new Promise( ( resolve, reject ) => {
		const expectedCurrentVersion = 67;
		const nextVersion = expectedCurrentVersion + 1;
		if ( currentVersion > expectedCurrentVersion ) {
			resolve( currentVersion );
		} else {
			db.query( 'UPDATE processsteps SET type= ? WHERE type = ?', ['transform', 'manipulate'], ( err, result ) => {
				if ( err ) {
					reject( err );
				} else {
					resolve( utils.updateToVersion( nextVersion ) );
				}
			} );
		}
	} );
};
const to0067 = ( currentVersion: number ) => {
	return new Promise( ( resolve, reject ) => {
		const expectedCurrentVersion = 66;
		const nextVersion = expectedCurrentVersion + 1;
		if ( currentVersion > expectedCurrentVersion ) {
			resolve( currentVersion );
		} else {
			db.query( 'ALTER TABLE processsteps CHANGE sOrder position INT( 10 ) UNSIGNED NULL DEFAULT NULL AFTER details', ( err, result ) => {
				if ( err ) {
					reject( err );
				} else {
					resolve( utils.updateToVersion( nextVersion ) );
				}
			} );
		}
	} );
};
const to0066 = ( currentVersion: number ) => {
	return new Promise( ( resolve, reject ) => {
		const expectedCurrentVersion = 65;
		const nextVersion = expectedCurrentVersion + 1;
		if ( currentVersion > expectedCurrentVersion ) {
			resolve( currentVersion );
		} else {
			db.query( 'DROP TABLE processsteptypes', ( err, result ) => {
				if ( err ) {
					reject( err );
				} else {
					resolve( utils.updateToVersion( nextVersion ) );
				}
			} );
		}
	} );
};
const to0065 = ( currentVersion: number ) => {
	return new Promise( ( resolve, reject ) => {
		const expectedCurrentVersion = 64;
		const nextVersion = expectedCurrentVersion + 1;
		if ( currentVersion > expectedCurrentVersion ) {
			resolve( currentVersion );
		} else {
			utils.tableAddColumn( 'maps', 'matrix BIGINT UNSIGNED NULL AFTER target' )
				.then( () => {
					resolve( utils.updateToVersion( nextVersion ) );
				} ).catch( reject );
		}
	} );
};
const to0064 = ( currentVersion: number ) => {
	return new Promise( ( resolve, reject ) => {
		const expectedCurrentVersion = 63;
		const nextVersion = expectedCurrentVersion + 1;
		if ( currentVersion > expectedCurrentVersion ) {
			resolve( currentVersion );
		} else {
			utils.tableAddColumn( 'matrices', 'tags TEXT NULL AFTER fields' )
				.then( () => {
					resolve( utils.updateToVersion( nextVersion ) );
				} ).catch( reject );
		}
	} );
};
const to0063 = ( currentVersion: number ) => {
	return new Promise( ( resolve, reject ) => {
		const expectedCurrentVersion = 62;
		const nextVersion = expectedCurrentVersion + 1;
		if ( currentVersion > expectedCurrentVersion ) {
			resolve( currentVersion );
		} else {
			utils.tableAddColumn( 'matrices', 'fields TEXT NULL AFTER stream' )
				.then( () => {
					resolve( utils.updateToVersion( nextVersion ) );
				} ).catch( reject );
		}
	} );
};
const to0062 = ( currentVersion: number ) => {
	return new Promise( ( resolve, reject ) => {
		const expectedCurrentVersion = 61;
		const nextVersion = expectedCurrentVersion + 1;
		if ( currentVersion > expectedCurrentVersion ) {
			resolve( currentVersion );
		} else {
			utils.tableAddColumn( 'maps', 'tags TEXT NULL AFTER target' )
				.then( () => {
					resolve( utils.updateToVersion( nextVersion ) );
				} ).catch( reject );
		}
	} );
};
const to0061 = ( currentVersion: number ) => {
	return new Promise( ( resolve, reject ) => {
		const expectedCurrentVersion = 60;
		const nextVersion = expectedCurrentVersion + 1;
		if ( currentVersion > expectedCurrentVersion ) {
			resolve( currentVersion );
		} else {
			db.query( 'DROP TABLE matrixfields', ( err, result ) => {
				if ( err ) {
					reject( err );
				} else {
					resolve( utils.updateToVersion( nextVersion ) );
				}
			} );
		}
	} );
};
const to0060 = ( currentVersion: number ) => {
	return new Promise( ( resolve, reject ) => {
		const expectedCurrentVersion = 59;
		const nextVersion = expectedCurrentVersion + 1;
		if ( currentVersion > expectedCurrentVersion ) {
			resolve( currentVersion );
		} else {
			db.query( 'ALTER TABLE streamfields DROP shouldIgnore', ( err, result ) => {
				if ( err ) {
					reject( err );
				} else {
					resolve( utils.updateToVersion( nextVersion ) );
				}
			} );
		}
	} );
};

const to0059 = ( currentVersion: number ) => {
	return new Promise( ( resolve, reject ) => {
		const expectedCurrentVersion = 58;
		const nextVersion = expectedCurrentVersion + 1;
		if ( currentVersion > expectedCurrentVersion ) {
			resolve( currentVersion );
		} else {
			// The functionality represented here is moved to a later update.
			// To the to0083 function to be precise.
			// This is because if we update the isdescribed field before checking and correcting the type of the stream,
			// it ruins the isdescribed fields for the streamfields table.
			resolve( utils.updateToVersion( nextVersion ) );
		}
	} );
};

const to0058 = ( currentVersion: number ) => {
	return new Promise( ( resolve, reject ) => {
		const expectedCurrentVersion = 57;
		const nextVersion = expectedCurrentVersion + 1;
		if ( currentVersion > expectedCurrentVersion ) {
			resolve( currentVersion );
		} else {
			db.query( 'ALTER TABLE environments DROP SID, DROP cookies', ( err, result ) => {
				if ( err ) {
					reject( err );
				} else {
					resolve( utils.updateToVersion( nextVersion ) );
				}
			} );
		}
	} );
};

const to0057 = ( currentVersion: number ) => {
	return new Promise( ( resolve, reject ) => {
		const expectedCurrentVersion = 56;
		const nextVersion = expectedCurrentVersion + 1;
		if ( currentVersion > expectedCurrentVersion ) {
			resolve( currentVersion );
		} else {
			utils.tableAddColumn( 'environments', 'cookies TEXT NULL AFTER SID' )
				.then( () => {
					resolve( utils.updateToVersion( nextVersion ) );
				} ).catch( reject );
		}
	} );
};

const to0056 = ( currentVersion: number ) => {
	return new Promise( ( resolve, reject ) => {
		const expectedCurrentVersion = 55;
		const nextVersion = expectedCurrentVersion + 1;
		if ( currentVersion > expectedCurrentVersion ) {
			resolve( currentVersion );
		} else {
			db.query( 'ALTER TABLE environments CHANGE ssotoken SID TEXT NULL DEFAULT NULL;', ( err, result ) => {
				if ( err ) {
					reject( err );
				} else {
					resolve( utils.updateToVersion( nextVersion ) );
				}
			} );
		}
	} );
};
const to0055 = ( currentVersion: number ) => {
	return new Promise( ( resolve, reject ) => {
		const expectedCurrentVersion = 54;
		const nextVersion = expectedCurrentVersion + 1;
		if ( currentVersion > expectedCurrentVersion ) {
			resolve( currentVersion );
		} else {
			utils.tableAddColumn( 'environments', 'ssotoken TEXT NULL AFTER credential' )
				.then( () => {
					resolve( utils.updateToVersion( nextVersion ) );
				} ).catch( reject );
		}
	} );
};
const to0054 = ( currentVersion: number ) => {
	return new Promise( ( resolve, reject ) => {
		const expectedCurrentVersion = 53;
		const nextVersion = expectedCurrentVersion + 1;
		if ( currentVersion > expectedCurrentVersion ) {
			resolve( currentVersion );
		} else {
			db.query( 'ALTER TABLE streamfields CHANGE fOrder position INT( 10 ) UNSIGNED NULL DEFAULT NULL AFTER type', ( err, result ) => {
				if ( err ) {
					reject( err );
				} else {
					resolve( utils.updateToVersion( nextVersion ) );
				}
			} );
		}
	} );
};
const to0053 = ( currentVersion: number ) => {
	return new Promise( ( resolve, reject ) => {
		const expectedCurrentVersion = 52;
		const nextVersion = expectedCurrentVersion + 1;
		if ( currentVersion > expectedCurrentVersion ) {
			resolve( currentVersion );
		} else {
			db.query( 'ALTER TABLE credentials CHANGE tags tags TEXT NULL DEFAULT NULL', ( err, result ) => {
				if ( err ) {
					reject( err );
				} else {
					resolve( utils.updateToVersion( nextVersion ) );
				}
			} );
		}
	} );
};
const to0052 = ( currentVersion: number ) => {
	return new Promise( ( resolve, reject ) => {
		const expectedCurrentVersion = 51;
		const nextVersion = expectedCurrentVersion + 1;
		if ( currentVersion > expectedCurrentVersion ) {
			resolve( currentVersion );
		} else {
			db.query( 'ALTER TABLE environments CHANGE tags tags TEXT NULL DEFAULT NULL', ( err, result ) => {
				if ( err ) {
					reject( err );
				} else {
					resolve( utils.updateToVersion( nextVersion ) );
				}
			} );
		}
	} );
};

const to0051 = ( currentVersion: number ) => {
	return new Promise( ( resolve, reject ) => {
		const expectedCurrentVersion = 50;
		const nextVersion = expectedCurrentVersion + 1;
		if ( currentVersion > expectedCurrentVersion ) {
			resolve( currentVersion );
		} else {
			utils.tableAddColumn( 'streams', 'tags TEXT NULL AFTER customQuery' )
				.then( () => {
					resolve( utils.updateToVersion( nextVersion ) );
				} ).catch( reject );
		}
	} );
};

const to0050 = ( currentVersion: number ) => {
	return new Promise( ( resolve, reject ) => {
		const expectedCurrentVersion = 49;
		const nextVersion = expectedCurrentVersion + 1;
		if ( currentVersion > expectedCurrentVersion ) {
			resolve( currentVersion );
		} else {
			db.query( 'ALTER TABLE environments DROP password', ( err, result ) => {
				if ( err ) {
					reject( err );
				} else {
					resolve( utils.updateToVersion( nextVersion ) );
				}
			} );
		}
	} );
};

const to0049 = ( currentVersion: number ) => {
	return new Promise( ( resolve, reject ) => {
		const expectedCurrentVersion = 48;
		const nextVersion = expectedCurrentVersion + 1;
		if ( currentVersion > expectedCurrentVersion ) {
			resolve( currentVersion );
		} else {
			db.query( 'ALTER TABLE environments DROP username', ( err, result ) => {
				if ( err ) {
					reject( err );
				} else {
					resolve( utils.updateToVersion( nextVersion ) );
				}
			} );
		}
	} );
};

const to0048 = ( currentVersion: number ) => {
	return new Promise( ( resolve, reject ) => {
		const expectedCurrentVersion = 47;
		const nextVersion = expectedCurrentVersion + 1;
		if ( currentVersion > expectedCurrentVersion ) {
			resolve( currentVersion );
		} else {
			const promises: any[] = [];
			db.query( 'SELECT * FROM environments', ( err, rows ) => {
				rows.forEach( ( curTuple: any ) => {
					if ( curTuple.password ) {
						const credentialToCreate = <DimeCredential>{};
						credentialToCreate.name = ( 'FromEnv-' + curTuple.id + '-' + curTuple.name ).substr( 0, 1000 );
						credentialToCreate.username = curTuple.username;
						credentialToCreate.password = tools.encryptText( tools.decryptTextOLDDONOTUSE( curTuple.password ) );
						credentialToCreate.tags = curTuple.tags;
						promises.push( new Promise( ( iResolve, iReject ) => {
							db.query( 'INSERT INTO credentials SET ?', credentialToCreate, ( iErr, iResult ) => {
								if ( iErr ) {
									iReject( iErr );
								} else {
									db.query( 'UPDATE environments SET credential = ? WHERE id = ?', [iResult.insertId, curTuple.id], ( uErr, uResult ) => {
										if ( uErr ) {
											iReject( uErr );
										} else {
											iResolve();
										}
									} );
								}
							} );
						} ) );
					}
				} );
			} );
			Promise.all( promises ).then( () => {
				resolve( utils.updateToVersion( nextVersion ) );
			} ).catch( reject );
		}
	} );
};

const to0047 = ( currentVersion: number ) => {
	return new Promise( ( resolve, reject ) => {
		const expectedCurrentVersion = 46;
		const nextVersion = expectedCurrentVersion + 1;
		if ( currentVersion > expectedCurrentVersion ) {
			resolve( currentVersion );
		} else {
			utils.tableAddColumn( 'environments', 'credential BIGINT UNSIGNED NULL AFTER identitydomain' )
				.then( () => {
					resolve( utils.updateToVersion( nextVersion ) );
				} ).catch( reject );
		}
	} );
};

const to0046 = ( currentVersion: number ) => {
	return new Promise( ( resolve, reject ) => {
		const expectedCurrentVersion = 45;
		const nextVersion = expectedCurrentVersion + 1;
		if ( currentVersion > expectedCurrentVersion ) {
			resolve( currentVersion );
		} else {
			db.query( 'DROP TABLE environmenttypes', ( err, result ) => {
				if ( err ) {
					reject( err );
				} else {
					resolve( utils.updateToVersion( nextVersion ) );
				}
			} );
		}
	} );

};

const to0045 = ( currentVersion: number ) => {
	return new Promise( ( resolve, reject ) => {
		const expectedCurrentVersion = 44;
		const nextVersion = expectedCurrentVersion + 1;
		if ( currentVersion > expectedCurrentVersion ) {
			resolve( currentVersion );
		} else {
			utils.tableAddColumn( 'environments', 'identitydomain VARCHAR(128) NULL AFTER verified' )
				.then( () => {
					resolve( utils.updateToVersion( nextVersion ) );
				} ).catch( reject );
		}
	} );
};

const to0044 = ( currentVersion: number ) => {
	return new Promise( ( resolve, reject ) => {
		const expectedCurrentVersion = 43;
		const nextVersion = expectedCurrentVersion + 1;
		if ( currentVersion > expectedCurrentVersion ) {
			resolve( currentVersion );
		} else {
			utils.tableAddColumn( 'environments', 'tags VARCHAR(4096) NULL AFTER password' )
				.then( () => {
					resolve( utils.updateToVersion( nextVersion ) );
				} ).catch( reject );
		}
	} );
};

const to0043 = ( currentVersion: number ) => {
	return new Promise( ( resolve, reject ) => {
		const expectedCurrentVersion = 42;
		const nextVersion = expectedCurrentVersion + 1;
		if ( currentVersion > expectedCurrentVersion ) {
			resolve( currentVersion );
		} else {
			db.query( 'ALTER TABLE environments DROP isconverted', ( err, result ) => {
				if ( err ) {
					reject( err );
				} else {
					resolve( utils.updateToVersion( nextVersion ) );
				}
			} );
		}
	} );
};

const to0042 = ( currentVersion: number ) => {
	return new Promise( ( resolve, reject ) => {
		const expectedCurrentVersion = 41;
		const nextVersion = expectedCurrentVersion + 1;
		if ( currentVersion > expectedCurrentVersion ) {
			resolve( currentVersion );
		} else {
			const environmentTypeObject = _.keyBy( EnumToArray( DimeEnvironmentType ), 'label' );
			const promises: any[] = [];

			db.query( 'SELECT * FROM environments WHERE isconverted = 0', ( err1, environmentList: DimeEnvironment[], environmentFields ) => {
				if ( err1 ) {
					reject( err1 );
				} else {
					db.query( 'SELECT * FROM environmenttypes', ( err2, typeList, typeFields ) => {
						if ( err2 ) {
							reject( err2 );
						} else {
							const typesObject = _.keyBy( typeList, 'id' );
							environmentList.forEach( ( curEnvironment: any ) => {

								curEnvironment.type = environmentTypeObject[typesObject[curEnvironment.type].value].value;
								curEnvironment.isconverted = 1;

								promises.push( new Promise( ( iResolve, iReject ) => {
									db.query( 'UPDATE environments SET ? WHERE id = ?', [curEnvironment, curEnvironment.id], ( iErr, iResult ) => {
										if ( iErr ) {
											iReject( iErr );
										} else {
											iResolve();
										}
									} );
								} ) );
							} );
							Promise.all( promises ).then( () => {
								resolve( utils.updateToVersion( nextVersion ) );
							} ).catch( reject );
						}
					} );
				}
			} );
		}
	} );
};

const to0041 = ( currentVersion: number ) => {
	return new Promise( ( resolve, reject ) => {
		const expectedCurrentVersion = 40;
		const nextVersion = expectedCurrentVersion + 1;
		if ( currentVersion > expectedCurrentVersion ) {
			resolve( currentVersion );
		} else {
			utils.tableAddColumn( 'environments', 'isconverted TINYINT NOT NULL DEFAULT 0 AFTER password' )
				.then( () => {
					resolve( utils.updateToVersion( nextVersion ) );
				} ).catch( reject );
		}
	} );
};

const to0040 = ( currentVersion: number ) => {
	return new Promise( ( resolve, reject ) => {
		const expectedCurrentVersion = 39;
		const nextVersion = expectedCurrentVersion + 1;
		if ( currentVersion > expectedCurrentVersion ) {
			resolve( currentVersion );
		} else {
			utils.tableAddColumn( 'credentials', 'tags VARCHAR(4096) NULL AFTER password' )
				.then( () => {
					resolve( utils.updateToVersion( nextVersion ) );
				} )
				.catch( reject );
		}
	} );
};

const to0039 = ( currentVersion: number ) => {
	return new Promise( ( resolve, reject ) => {
		const expectedCurrentVersion = 38;
		const nextVersion = expectedCurrentVersion + 1;
		if ( currentVersion > expectedCurrentVersion ) {
			resolve( currentVersion );
		} else {
			const tableDef: TableDefiner = {
				name: 'taggroups',
				fields: ['id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT',
					'name varchar(1024) NOT NULL DEFAULT \'New Tag Group\'',
					'position INT UNSIGNED NOT NULL'
				],
				primaryKey: 'id',
				values: [{ name: 'First Tag Group', position: 0 }],
				fieldsToCheck: ['name']
			};


			resolve( utils.checkAndCreateTable( tableDef ).then( () => utils.updateToVersion( nextVersion ) ) );
		}
	} );
};

const to0038 = ( currentVersion: number ) => {
	return new Promise( ( resolve, reject ) => {
		const expectedCurrentVersion = 37;
		const nextVersion = expectedCurrentVersion + 1;
		if ( currentVersion > expectedCurrentVersion ) {
			resolve( currentVersion );
		} else {
			const tableDef: TableDefiner = {
				name: 'tags',
				fields: ['id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT',
					'name varchar(1024) NOT NULL DEFAULT \'New Tag\'',
					'description varchar(4096) NOT NULL DEFAULT \'\'',
					'taggroup BIGINT UNSIGNED NULL'
				],
				primaryKey: 'id'
			};
			resolve( utils.checkAndCreateTable( tableDef ).then( () => utils.updateToVersion( nextVersion ) ) );
		}
	} );
};

const to0037 = ( currentVersion: number ) => {
	return new Promise( ( resolve, reject ) => {
		const expectedCurrentVersion = 36;
		const nextVersion = expectedCurrentVersion + 1;
		if ( currentVersion > expectedCurrentVersion ) {
			resolve( currentVersion );
		} else {
			const tableDef: TableDefiner = {
				name: 'credentials',
				fields: ['id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT',
					'name varchar(1024) NOT NULL DEFAULT \'New Credential\'',
					'username varchar(4096) NOT NULL DEFAULT \'\'',
					'password varchar(4096) NOT NULL DEFAULT \'\''
				],
				primaryKey: 'id'
			};
			resolve( utils.checkAndCreateTable( tableDef ).then( () => utils.updateToVersion( nextVersion ) ) );
		}
	} );

};

const to0036 = ( currentVersion: number ) => {
	return new Promise( ( resolve, reject ) => {
		const expectedCurrentVersion = 35;
		const nextVersion = expectedCurrentVersion + 1;
		if ( currentVersion > expectedCurrentVersion ) {
			resolve( currentVersion );
		} else {
			db.query( 'ALTER TABLE matrices CHANGE map stream BIGINT UNSIGNED NOT NULL DEFAULT 0', ( err, results, fields ) => {
				if ( err ) {
					reject( err );
				} else {
					resolve( utils.updateToVersion( nextVersion ) );
				}
			} );
		}
	} );

};

const to0035 = ( currentVersion: number ) => {
	return new Promise( ( resolve, reject ) => {
		const expectedCurrentVersion = 34;
		const nextVersion = expectedCurrentVersion + 1;
		if ( currentVersion > expectedCurrentVersion ) {
			resolve( currentVersion );
		} else {
			db.query( 'ALTER TABLE `logs` CHANGE `details` `details` LONGBLOB NULL DEFAULT NULL', ( err, results, fields ) => {
				if ( err ) {
					reject( err );
				} else {
					resolve( utils.updateToVersion( nextVersion ) );
				}
			} );
		}
	} );

};

const to0034 = ( currentVersion: number ) => {
	return new Promise( ( resolve, reject ) => {
		const expectedCurrentVersion = 33;
		const nextVersion = expectedCurrentVersion + 1;
		if ( currentVersion > expectedCurrentVersion ) {
			resolve( currentVersion );
		} else {
			db.query( 'ALTER TABLE `logs` ADD COLUMN `refid` BIGINT UNSIGNED NOT NULL DEFAULT 0 AFTER `details`', ( err, results, fields ) => {
				if ( err ) {
					if ( err.code === 'ER_DUP_FIELDNAME' ) {
						db.query( 'ALTER TABLE logs MODIFY refid BIGINT UNSIGNED NOT NULL DEFAULT 0 AFTER details', ( ierr, iresults, ifields ) => {
							if ( ierr ) {
								reject( ierr );
							} else {
								resolve( utils.updateToVersion( nextVersion ) );
							}
						} );
					} else {
						reject( err );
					}
				} else {
					resolve( utils.updateToVersion( nextVersion ) );
				}
			} );
		}
	} );

};

const to0033 = ( currentVersion: number ) => {
	return new Promise( ( resolve, reject ) => {
		const expectedCurrentVersion = 32;
		const nextVersion = expectedCurrentVersion + 1;
		if ( currentVersion > expectedCurrentVersion ) {
			resolve( currentVersion );
		} else {
			db.query( 'ALTER TABLE `processes` ADD COLUMN `erroremail` VARCHAR(1024) NULL DEFAULT \'\' AFTER `status`', ( err, results, fields ) => {
				if ( err ) {
					if ( err.code === 'ER_DUP_FIELDNAME' ) {
						db.query( 'ALTER TABLE processes MODIFY erroremail VARCHAR(1024) NULL DEFAULT \'\' AFTER `status`', ( ierr, iresults, ifields ) => {
							if ( ierr ) {
								reject( ierr );
							} else {
								resolve( utils.updateToVersion( nextVersion ) );
							}
						} );
					} else {
						reject( err );
					}
				} else {
					resolve( utils.updateToVersion( nextVersion ) );
				}
			} );
		}
	} );

};

const to0032 = ( currentVersion: number ) => {
	return new Promise( ( resolve, reject ) => {
		const expectedCurrentVersion = 31;
		const nextVersion = expectedCurrentVersion + 1;
		if ( currentVersion > expectedCurrentVersion ) {
			resolve( currentVersion );
		} else {
			db.query( 'ALTER TABLE `logs` ADD COLUMN `reftype` VARCHAR(256) NOT NULL AFTER `details`', ( err, results, fields ) => {
				if ( err ) {
					if ( err.code === 'ER_DUP_FIELDNAME' ) {
						db.query( 'ALTER TABLE logs MODIFY reftype VARCHAR(256) NOT NULL AFTER `details`', ( ierr, iresults, ifields ) => {
							if ( ierr ) {
								reject( ierr );
							} else {
								resolve( utils.updateToVersion( nextVersion ) );
							}
						} );
					} else {
						reject( err );
					}
				} else {
					resolve( utils.updateToVersion( nextVersion ) );
				}
			} );
		}
	} );

};

const to0031 = ( currentVersion: number ) => {
	return new Promise( ( resolve, reject ) => {
		const expectedCurrentVersion = 30;
		const nextVersion = expectedCurrentVersion + 1;
		if ( currentVersion > expectedCurrentVersion ) {
			resolve( currentVersion );
		} else {
			db.query( 'ALTER TABLE `streamfields` ADD COLUMN `generation2members` VARCHAR(4096) DEFAULT \'\' AFTER `ddfDateFormat`', ( err, results, fields ) => {
				if ( err ) {
					if ( err.code === 'ER_DUP_FIELDNAME' ) {
						db.query( 'ALTER TABLE streamfields MODIFY generation2members VARCHAR(4096) DEFAULT \'\' AFTER `ddfDateFormat`', ( ierr, iresults, ifields ) => {
							if ( ierr ) {
								reject( ierr );
							} else {
								resolve( utils.updateToVersion( nextVersion ) );
							}
						} );
					} else {
						reject( err );
					}
				} else {
					resolve( utils.updateToVersion( nextVersion ) );
				}
			} );
		}
	} );

};

const to0030 = ( currentVersion: number ) => {
	return new Promise( ( resolve, reject ) => {
		const expectedCurrentVersion = 29;
		const nextVersion = expectedCurrentVersion + 1;
		if ( currentVersion > expectedCurrentVersion ) {
			resolve( currentVersion );
		} else {
			db.query( 'ALTER TABLE `streamfields` ADD COLUMN `isCrossTabFilter` TINYINT NULL DEFAULT 0 AFTER `shouldIgnoreCrossTab`', ( err, results, fields ) => {
				if ( err ) {
					if ( err.code === 'ER_DUP_FIELDNAME' ) {
						db.query( 'ALTER TABLE streamfields MODIFY isCrossTabFilter TINYINT NULL DEFAULT 0 AFTER `shouldIgnoreCrossTab`', ( ierr, iresults, ifields ) => {
							if ( ierr ) {
								reject( ierr );
							} else {
								resolve( utils.updateToVersion( nextVersion ) );
							}
						} );
					} else {
						reject( err );
					}
				} else {
					resolve( utils.updateToVersion( nextVersion ) );
				}
			} );
		}
	} );

};

const to0029 = ( currentVersion: number ) => {
	return new Promise( ( resolve, reject ) => {
		const expectedCurrentVersion = 28;
		const nextVersion = expectedCurrentVersion + 1;
		if ( currentVersion > expectedCurrentVersion ) {
			resolve( currentVersion );
		} else {
			db.query( 'ALTER TABLE `streamfields` ADD COLUMN `shouldIgnoreCrossTab` TINYINT NULL DEFAULT 0 AFTER `fOrder`', ( err, results, fields ) => {
				if ( err ) {
					if ( err.code === 'ER_DUP_FIELDNAME' ) {
						db.query( 'ALTER TABLE streamfields MODIFY shouldIgnoreCrossTab TINYINT NULL DEFAULT 0 AFTER `fOrder`', ( ierr, iresults, ifields ) => {
							if ( ierr ) {
								reject( ierr );
							} else {
								resolve( utils.updateToVersion( nextVersion ) );
							}
						} );
					} else {
						reject( err );
					}
				} else {
					resolve( utils.updateToVersion( nextVersion ) );
				}
			} );
		}
	} );

};

const to0028 = ( currentVersion: number ) => {
	return new Promise( ( resolve, reject ) => {
		const expectedCurrentVersion = 27;
		const nextVersion = expectedCurrentVersion + 1;
		if ( currentVersion > expectedCurrentVersion ) {
			resolve( currentVersion );
		} else {
			db.query( 'ALTER TABLE `streamfields` ADD COLUMN `shouldIgnore` TINYINT NULL DEFAULT 0 AFTER `fOrder`', ( err, results, fields ) => {
				if ( err ) {
					if ( err.code === 'ER_DUP_FIELDNAME' ) {
						db.query( 'ALTER TABLE streamfields MODIFY shouldIgnore TINYINT NULL DEFAULT 0 AFTER fOrder', ( ierr, iresults, ifields ) => {
							if ( ierr ) {
								reject( ierr );
							} else {
								resolve( utils.updateToVersion( nextVersion ) );
							}
						} );
					} else {
						reject( err );
					}
				} else {
					resolve( utils.updateToVersion( nextVersion ) );
				}
			} );
		}
	} );

};

const to0027 = ( currentVersion: number ) => {
	return new Promise( ( resolve, reject ) => {
		const expectedCurrentVersion = 26;
		const nextVersion = expectedCurrentVersion + 1;
		if ( currentVersion > expectedCurrentVersion ) {
			resolve( currentVersion );
		} else {
			db.query( 'ALTER TABLE environments MODIFY password VARCHAR(4096)', ( err, results, fields ) => {
				if ( err ) {
					reject( err );
				} else {
					resolve( utils.updateToVersion( nextVersion ) );
				}
			} );
		}
	} );

};

const to0026 = ( currentVersion: number ) => {
	return new Promise( ( resolve, reject ) => {
		const expectedCurrentVersion = 25;
		const nextVersion = expectedCurrentVersion + 1;
		if ( currentVersion > expectedCurrentVersion ) {
			resolve( currentVersion );
		} else {
			const tableDef: TableDefiner = {
				name: 'asyncprocesses',
				fields: [
					'id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT',
					'name VARCHAR(2048) NULL',
					'sourceenvironment BIGINT UNSIGNED NULL',
					'sourceapplication VARCHAR(256) NULL',
					'sourceplantype VARCHAR(256) NULL',
					'sourcefixes VARCHAR(8192) NULL',
					'targettype INT UNSIGNED NULL',
					'targetenvironment BIGINT UNSIGNED NULL',
					'targetapplication VARCHAR(256) NULL',
					'targetplantype VARCHAR(256) NULL',
					'processmap VARCHAR(8192) NULL'
				],
				primaryKey: 'id'
			};

			resolve( utils.checkAndCreateTable( tableDef ).then( () => utils.updateToVersion( nextVersion ) ) );
		}
	} );

};

const to0025 = ( currentVersion: number ) => {
	return new Promise( ( resolve, reject ) => {
		const expectedCurrentVersion = 24;
		const nextVersion = expectedCurrentVersion + 1;
		if ( currentVersion > expectedCurrentVersion ) {
			resolve( currentVersion );
		} else {
			const tableDef: TableDefiner = {
				name: 'schedules',
				fields: [
					'id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT',
					'name VARCHAR(2048)',
					'schedule TEXT',
					'steps TEXT',
					'status INT UNSIGNED'
				],
				primaryKey: 'id'
			};

			resolve( utils.checkAndCreateTable( tableDef ).then( () => utils.updateToVersion( nextVersion ) ) );
		}
	} );

};

const to0024 = ( currentVersion: number ) => {
	return new Promise( ( resolve, reject ) => {
		const expectedCurrentVersion = 23;
		const nextVersion = expectedCurrentVersion + 1;
		if ( currentVersion > expectedCurrentVersion ) {
			resolve( currentVersion );
		} else {
			const tableDef: TableDefiner = {
				name: 'userdimeprocesses',
				fields: [
					'id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT',
					'user BIGINT UNSIGNED',
					'process BIGINT UNSIGNED'
				],
				primaryKey: 'id'
			};

			resolve( utils.checkAndCreateTable( tableDef ).then( () => utils.updateToVersion( nextVersion ) ) );
		}
	} );

};

const to0023 = ( currentVersion: number ) => {
	return new Promise( ( resolve, reject ) => {
		const expectedCurrentVersion = 22;
		const nextVersion = expectedCurrentVersion + 1;
		if ( currentVersion > expectedCurrentVersion ) {
			resolve( currentVersion );
		} else {
			const tableDef: TableDefiner = {
				name: 'matrixfields',
				fields: [
					'id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT',
					'name VARCHAR(1024)',
					'matrix BIGINT UNSIGNED NOT NULL',
					'map BIGINT UNSIGNED NOT NULL',
					'stream BIGINT UNSIGNED NOT NULL',
					'isDescribed TINYINT DEFAULT 0',
					'streamFieldID BIGINT UNSIGNED NOT NULL',
					'isAssigned TINYINT DEFAULT 0',
					'fOrder INT UNSIGNED'
				],
				primaryKey: 'id'
			};

			resolve( utils.checkAndCreateTable( tableDef ).then( () => utils.updateToVersion( nextVersion ) ) );
		}
	} );

};

const to0022 = ( currentVersion: number ) => {
	return new Promise( ( resolve, reject ) => {
		const expectedCurrentVersion = 21;
		const nextVersion = expectedCurrentVersion + 1;
		if ( currentVersion > expectedCurrentVersion ) {
			resolve( currentVersion );
		} else {
			const tableDef: TableDefiner = {
				name: 'matrices',
				fields: [
					'id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT',
					'name VARCHAR(1024)',
					'map BIGINT UNSIGNED'
				],
				primaryKey: 'id'
			};

			resolve( utils.checkAndCreateTable( tableDef ).then( () => utils.updateToVersion( nextVersion ) ) );
		}
	} );

};

const to0021 = ( currentVersion: number ) => {
	return new Promise( ( resolve, reject ) => {
		const expectedCurrentVersion = 20;
		const nextVersion = expectedCurrentVersion + 1;
		if ( currentVersion > expectedCurrentVersion ) {
			resolve( currentVersion );
		} else {
			const tableDef: TableDefiner = {
				name: 'acmservers',
				fields: [
					'id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT',
					'name VARCHAR(1024)',
					'description VARCHAR(4096)',
					'prefix VARCHAR(1024)',
					'hostname VARCHAR(1024)',
					'port INT UNSIGNED',
					'sslenabled TINYINT',
					'istrusted TINYINT',
					'basedn VARCHAR(1024)',
					'userdn VARCHAR(1024)',
					'password VARCHAR(4096)'
				],
				primaryKey: 'id'
			};

			resolve( utils.checkAndCreateTable( tableDef ).then( () => utils.updateToVersion( nextVersion ) ) );
		}
	} );

};

const to0020 = ( currentVersion: number ) => {
	return new Promise( ( resolve, reject ) => {
		const expectedCurrentVersion = 19;
		const nextVersion = expectedCurrentVersion + 1;
		if ( currentVersion > expectedCurrentVersion ) {
			resolve( currentVersion );
		} else {
			const tableDef: TableDefiner = {
				name: 'processsteptypes',
				fields: [
					'name VARCHAR(255) NOT NULL',
					'value VARCHAR(255) NOT NULL',
					'tOrder INT UNSIGNED NOT NULL'
				],
				primaryKey: 'value',
				values: [
					{ name: 'Source Procedure', value: 'srcprocedure', tOrder: 1 },
					{ name: 'Pull Data', value: 'pulldata', tOrder: 2 },
					{ name: 'Map Data', value: 'mapdata', tOrder: 3 },
					{ name: 'Transform Data', value: 'manipulate', tOrder: 4 },
					{ name: 'Push Data', value: 'pushdata', tOrder: 5 },
					{ name: 'Target Procedure', value: 'tarprocedure', tOrder: 6 },
					{ name: 'Send Logs', value: 'sendlogs', tOrder: 7 },
					{ name: 'Send Data', value: 'senddata', tOrder: 8 },
					{ name: 'Send Missing Maps', value: 'sendmissing', tOrder: 9 }
				],
				fieldsToCheck: ['name', 'value']
			};

			resolve( utils.checkAndCreateTable( tableDef ).then( () => utils.updateToVersion( nextVersion ) ) );
		}
	} );

};

const to0019 = ( currentVersion: number ) => {
	return new Promise( ( resolve, reject ) => {
		const expectedCurrentVersion = 18;
		const nextVersion = expectedCurrentVersion + 1;
		if ( currentVersion > expectedCurrentVersion ) {
			resolve( currentVersion );
		} else {
			const tableDef: TableDefiner = {
				name: 'secrets',
				fields: ['id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT',
					'secret VARCHAR(4096)',
					'description VARCHAR(4096)',
					'allowedips VARCHAR(4096)'],
				primaryKey: 'id'
			};

			resolve( utils.checkAndCreateTable( tableDef ).then( () => utils.updateToVersion( nextVersion ) ) );
		}
	} );

};

const to0018 = ( currentVersion: number ) => {
	return new Promise( ( resolve, reject ) => {
		const expectedCurrentVersion = 17;
		const nextVersion = expectedCurrentVersion + 1;
		if ( currentVersion > expectedCurrentVersion ) {
			resolve( currentVersion );
		} else {
			const tableDef: TableDefiner = {
				name: 'ldapservers',
				fields: ['id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT',
					'name varchar(1024)',
					'host varchar(1024)',
					'port varchar(5)',
					'prefix varchar(1024)',
					'searchdn varchar(1024)',
					'username varchar(1024)',
					'password varchar(1024)'],
				primaryKey: 'id'
			};

			resolve( utils.checkAndCreateTable( tableDef ).then( () => utils.updateToVersion( nextVersion ) ) );
		}
	} );

};

const to0017 = ( currentVersion: number ) => {
	return new Promise( ( resolve, reject ) => {
		const expectedCurrentVersion = 16;
		const nextVersion = expectedCurrentVersion + 1;
		if ( currentVersion > expectedCurrentVersion ) {
			resolve( currentVersion );
		} else {
			const tableDef: TableDefiner = {
				name: 'settings',
				fields: ['id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT',
					'name varchar(1024)',
					'value varchar(2048)'],
				primaryKey: 'id'
			};


			resolve( utils.checkAndCreateTable( tableDef ).then( () => utils.updateToVersion( nextVersion ) ) );
		}
	} );

};

const to0016 = ( currentVersion: number ) => {
	return new Promise( ( resolve, reject ) => {
		const expectedCurrentVersion = 15;
		const nextVersion = expectedCurrentVersion + 1;
		if ( currentVersion > expectedCurrentVersion ) {
			resolve( currentVersion );
		} else {
			const tableDef: TableDefiner = {
				name: 'processfiltersdatafile',
				fields: ['id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT',
					'process BIGINT UNSIGNED',
					'stream BIGINT UNSIGNED',
					'field BIGINT UNSIGNED',
					'filterfrom DATETIME',
					'filterto DATETIME',
					'filtertext varchar(1024)',
					'filterbeq NUMERIC(38,10)',
					'filterseq NUMERIC(38,10)'],
				primaryKey: 'id'
			};

			resolve( utils.checkAndCreateTable( tableDef ).then( () => utils.updateToVersion( nextVersion ) ) );
		}
	} );

};

const to0015 = ( currentVersion: number ) => {
	return new Promise( ( resolve, reject ) => {
		const expectedCurrentVersion = 14;
		const nextVersion = expectedCurrentVersion + 1;
		if ( currentVersion > expectedCurrentVersion ) {
			resolve( currentVersion );
		} else {
			const tableDef: TableDefiner = {
				name: 'processfilters',
				fields: ['id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT',
					'process BIGINT UNSIGNED',
					'stream BIGINT UNSIGNED',
					'field BIGINT UNSIGNED',
					'filterfrom DATETIME',
					'filterto DATETIME',
					'filtertext varchar(1024)',
					'filterbeq NUMERIC(38,10)',
					'filterseq NUMERIC(38,10)'],
				primaryKey: 'id'
			};

			resolve( utils.checkAndCreateTable( tableDef ).then( () => utils.updateToVersion( nextVersion ) ) );
		}
	} );

};

const to0014 = ( currentVersion: number ) => {
	return new Promise( ( resolve, reject ) => {
		const expectedCurrentVersion = 13;
		const nextVersion = expectedCurrentVersion + 1;
		if ( currentVersion > expectedCurrentVersion ) {
			resolve( currentVersion );
		} else {
			const tableDef: TableDefiner = {
				name: 'processdefaulttargets',
				fields: ['id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT',
					'process BIGINT UNSIGNED',
					'field varchar(255)',
					'value varchar(255)'],
				primaryKey: 'id'
			};

			resolve( utils.checkAndCreateTable( tableDef ).then( () => utils.updateToVersion( nextVersion ) ) );
		}
	} );

};

const to0013 = ( currentVersion: number ) => {
	return new Promise( ( resolve, reject ) => {
		const expectedCurrentVersion = 12;
		const nextVersion = expectedCurrentVersion + 1;
		if ( currentVersion > expectedCurrentVersion ) {
			resolve( currentVersion );
		} else {
			const tableDef: TableDefiner = {
				name: 'processsteps',
				fields: ['id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT',
					'process BIGINT UNSIGNED',
					'type varchar(255)',
					'referedid BIGINT UNSIGNED',
					'details BLOB',
					'sOrder INT UNSIGNED'],
				primaryKey: 'id'
			};

			resolve( utils.checkAndCreateTable( tableDef ).then( () => utils.updateToVersion( nextVersion ) ) );
		}
	} );
};

const to0012 = ( currentVersion: number ) => {
	return new Promise( ( resolve, reject ) => {
		const expectedCurrentVersion = 11;
		const nextVersion = expectedCurrentVersion + 1;
		if ( currentVersion > expectedCurrentVersion ) {
			resolve( currentVersion );
		} else {
			const tableDef: TableDefiner = {
				name: 'processes',
				fields: ['id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT',
					'name varchar(255)',
					'source BIGINT UNSIGNED',
					'target BIGINT UNSIGNED',
					'status varchar(255)'],
				primaryKey: 'id'
			};

			resolve( utils.checkAndCreateTable( tableDef ).then( () => utils.updateToVersion( nextVersion ) ) );
		}
	} );

};

const to0011 = ( currentVersion: number ) => {
	return new Promise( ( resolve, reject ) => {
		const expectedCurrentVersion = 10;
		const nextVersion = expectedCurrentVersion + 1;
		if ( currentVersion > expectedCurrentVersion ) {
			resolve( currentVersion );
		} else {
			const tableDef: TableDefiner = {
				name: 'logs',
				fields: ['id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT',
					'parent BIGINT UNSIGNED',
					'start DATETIME',
					'end DATETIME',
					'details BLOB'],
				primaryKey: 'id'
			};

			resolve( utils.checkAndCreateTable( tableDef ).then( () => utils.updateToVersion( nextVersion ) ) );
		}
	} );

};

const to0010 = ( currentVersion: number ) => {
	return new Promise( ( resolve, reject ) => {
		const expectedCurrentVersion = 9;
		const nextVersion = expectedCurrentVersion + 1;
		if ( currentVersion > expectedCurrentVersion ) {
			resolve( currentVersion );
		} else {
			const tableDef: TableDefiner = {
				name: 'mapfields',
				fields: ['id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT',
					'map BIGINT UNSIGNED',
					'srctar varchar(6)',
					'name varchar(255)'],
				primaryKey: 'id'
			};

			resolve( utils.checkAndCreateTable( tableDef ).then( () => utils.updateToVersion( nextVersion ) ) );
		}
	} );

};

const to0009 = ( currentVersion: number ) => {
	return new Promise( ( resolve, reject ) => {
		const expectedCurrentVersion = 8;
		const nextVersion = expectedCurrentVersion + 1;
		if ( currentVersion > expectedCurrentVersion ) {
			resolve( currentVersion );
		} else {
			const tableDef: TableDefiner = {
				name: 'maptypes',
				fields: ['id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT',
					'name varchar(255) NOT NULL',
					'value varchar(255) NOT NULL'],
				primaryKey: 'id',
				values: [{ name: 'Intersection Based Map', value: 'IBM' },
				{ name: 'Segment Based Map', value: 'SBM' }],
				fieldsToCheck: ['name', 'value']
			};

			resolve( utils.checkAndCreateTable( tableDef ).then( () => utils.updateToVersion( nextVersion ) ) );
		}
	} );

};

const to0008 = ( currentVersion: number ) => {
	return new Promise( ( resolve, reject ) => {
		const expectedCurrentVersion = 7;
		const nextVersion = expectedCurrentVersion + 1;
		if ( currentVersion > expectedCurrentVersion ) {
			resolve( currentVersion );
		} else {
			const tableDef: TableDefiner = {
				name: 'maps',
				fields: ['id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT',
					'name varchar(255) NOT NULL',
					'type BIGINT UNSIGNED',
					'source BIGINT UNSIGNED',
					'target BIGINT UNSIGNED'],
				primaryKey: 'id'
			};

			resolve( utils.checkAndCreateTable( tableDef ).then( () => utils.updateToVersion( nextVersion ) ) );
		}
	} );

};

const to0007 = ( currentVersion: number ) => {
	return new Promise( ( resolve, reject ) => {
		const expectedCurrentVersion = 6;
		const nextVersion = expectedCurrentVersion + 1;
		if ( currentVersion > expectedCurrentVersion ) {
			resolve( currentVersion );
		} else {
			const tableDef: TableDefiner = {
				name: 'streampreprocesses',
				fields: ['id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT',
					'pQuery varchar(20000)',
					'pOrder INT UNSIGNED',
					'stream BIGINT UNSIGNED'],
				primaryKey: 'id'
			};

			resolve( utils.checkAndCreateTable( tableDef ).then( () => utils.updateToVersion( nextVersion ) ) );
		}
	} );

};

const to0006 = ( currentVersion: number ) => {
	return new Promise( ( resolve, reject ) => {
		const expectedCurrentVersion = 5;
		const nextVersion = expectedCurrentVersion + 1;
		if ( currentVersion > expectedCurrentVersion ) {
			resolve( currentVersion );
		} else {
			const tableDef: TableDefiner = {
				name: 'streamfields',
				fields: ['id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT',
					'stream BIGINT UNSIGNED NOT NULL',
					'name varchar(1024) NOT NULL',
					'type varchar(128) NOT NULL',
					'fCharacters INT UNSIGNED',
					'fPrecision INT UNSIGNED',
					'fDecimals INT UNSIGNED',
					'fDateFormat varchar(1024)',
					'fOrder INT UNSIGNED',
					'isDescribed TINYINT DEFAULT 0',
					'isFilter TINYINT DEFAULT 0',
					'isCrossTab TINYINT DEFAULT 0',
					'isMonth TINYINT DEFAULT 0',
					'isData TINYINT DEFAULT 0',
					'aggregateFunction varchar(16)',
					'descriptiveDB varchar(1024)',
					'descriptiveTable varchar(1024)',
					'descriptiveQuery varchar(1024)',
					'drfName varchar(1024)',
					'drfType varchar(128)',
					'drfCharacters INT UNSIGNED',
					'drfPrecision INT UNSIGNED',
					'drfDecimals INT UNSIGNED',
					'drfDateFormat varchar(1024)',
					'ddfName varchar(1024)',
					'ddfType varchar(128)',
					'ddfCharacters INT UNSIGNED',
					'ddfPrecision INT UNSIGNED',
					'ddfDecimals INT UNSIGNED',
					'ddfDateFormat varchar(1024)'
				],
				primaryKey: 'id'
			};

			resolve( utils.checkAndCreateTable( tableDef ).then( () => utils.updateToVersion( nextVersion ) ) );
		}
	} );

};

const to0005 = ( currentVersion: number ) => {
	return new Promise( ( resolve, reject ) => {
		const expectedCurrentVersion = 4;
		const nextVersion = expectedCurrentVersion + 1;
		if ( currentVersion > expectedCurrentVersion ) {
			resolve( currentVersion );
		} else {
			const tableDef: TableDefiner = {
				name: 'streamtypes',
				fields: ['id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT',
					'name varchar(255) NOT NULL',
					'value varchar(255) NOT NULL'],
				primaryKey: 'id',
				values: [{ name: 'Planning Database', value: 'HPDB' },
				{ name: 'Relational Database Table/View', value: 'RDBT' }],
				fieldsToCheck: ['name', 'value']
			};

			resolve( utils.checkAndCreateTable( tableDef ).then( () => utils.updateToVersion( nextVersion ) ) );
		}
	} );

};

const to0004 = ( currentVersion: number ) => {
	return new Promise( ( resolve, reject ) => {
		const expectedCurrentVersion = 3;
		const nextVersion = expectedCurrentVersion + 1;
		if ( currentVersion > expectedCurrentVersion ) {
			resolve( currentVersion );
		} else {
			const tableDef: TableDefiner = {
				name: 'streams',
				fields: ['id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT',
					'name varchar(255) NOT NULL',
					'type BIGINT UNSIGNED NOT NULL',
					'environment BIGINT UNSIGNED NOT NULL',
					'dbName varchar(255)',
					'tableName varchar(255)',
					'customQuery varchar(20000)'],
				primaryKey: 'id'
			};

			resolve( utils.checkAndCreateTable( tableDef ).then( () => utils.updateToVersion( nextVersion ) ) );
		}
	} );

};

const to0003 = ( currentVersion: number ) => {
	return new Promise( ( resolve, reject ) => {
		const expectedCurrentVersion = 2;
		const nextVersion = expectedCurrentVersion + 1;
		if ( currentVersion > expectedCurrentVersion ) {
			resolve( currentVersion );
		} else {
			const tableDef: TableDefiner = {
				name: 'environments',
				fields: ['id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT',
					'name varchar(255) NOT NULL',
					'type BIGINT UNSIGNED NOT NULL',
					'server varchar(255) NOT NULL',
					'port varchar(5) NOT NULL',
					'verified TINYINT DEFAULT 0',
					'username varchar(255) NOT NULL',
					'password varchar(255) NOT NULL'],
				primaryKey: 'id'
			};

			resolve( utils.checkAndCreateTable( tableDef ).then( () => utils.updateToVersion( nextVersion ) ) );
		}
	} );

};

const to0002 = ( currentVersion: number ) => {
	return new Promise( ( resolve, reject ) => {
		const expectedCurrentVersion = 1;
		const nextVersion = expectedCurrentVersion + 1;
		if ( currentVersion > expectedCurrentVersion ) {
			resolve( currentVersion );
		} else {
			const tableDef: TableDefiner = {
				name: 'environmenttypes',
				fields: ['id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT', 'name varchar(255) NOT NULL', 'value varchar(255) NOT NULL'],
				primaryKey: 'id',
				values: [
					{ name: 'Hyperion Planning On-premises', value: 'HP' },
					{ name: 'Microsoft SQL Server', value: 'MSSQL' },
					{ name: 'Hyperion Planning PBCS', value: 'PBCS' }
				],
				fieldsToCheck: ['name', 'value']
			};

			resolve( utils.checkAndCreateTable( tableDef ).then( () => utils.updateToVersion( nextVersion ) ) );
		}
	} );

};

const to0001 = ( currentVersion: number ) => {
	return new Promise( ( resolve, reject ) => {
		const expectedCurrentVersion = 0;
		const nextVersion = expectedCurrentVersion + 1;
		if ( currentVersion > expectedCurrentVersion ) {
			resolve( currentVersion );
		} else {
			const tableDef: TableDefiner = {
				name: 'users',
				fields: ['id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT',
					'username varchar(255) NOT NULL',
					'password varchar(255) NOT NULL',
					'role varchar(255)',
					'type varchar(255)',
					'ldapserver BIGINT UNSIGNED',
					'email varchar(1024)',
					'name varchar(255)',
					'surname varchar(255)'],
				primaryKey: 'id',
				values: [{ username: 'admin', password: bcrypt.hashSync( 'interesting', 10 ), role: 'admin', type: 'local' }],
				fieldsToCheck: ['username', 'role']
			};


			resolve( utils.checkAndCreateTable( tableDef ).then( () => utils.updateToVersion( nextVersion ) ) );
		}
	} );
};

const clearResidue = () => {
	return new Promise( ( resolve, reject ) => {
		console.log( '===============================================' );
		console.log( '=== Clearing Residue                        ===' );
		db.query( 'UPDATE schedules SET status = ?', ATStatusType.Ready, ( err, result, fields ) => {
			if ( err ) {
				console.log( '===============================================' );
				console.log( '=== Residue clearing has failed             ===' );
				console.log( err );
				console.log( '===============================================' );
				resolve();
			} else {
				console.log( '===============================================' );
				console.log( '=== Residue clearing has finished           ===' );
				console.log( '===============================================' );
				resolve();
			}
		} );
	} );
};

const checkVersion = () => {
	return utils.doWeHaveTable( 'currentversion' ).
		then( checkVersionCreateTable ).
		then( checkVersionInsertFirstRecord ).
		then( checkVersionFindVersion ).
		catch( console.error );
};

const checkVersionCreateTable = ( doWeHave: number ) => {
	return new Promise( ( resolve, reject ) => {
		if ( doWeHave > 0 ) {
			resolve( doWeHave );
		} else {
			const q = 'CREATE TABLE currentversion ( version SMALLINT UNSIGNED NULL )';
			db.query( q, ( err, rows, fields ) => {
				if ( err ) {
					reject( err );
				} else {
					resolve( doWeHave );
				}
			} );
		}
	} );
};

const checkVersionInsertFirstRecord = ( doWeHave: number ) => {
	return new Promise( ( resolve, reject ) => {
		if ( doWeHave > 0 ) {
			resolve( doWeHave );
		} else {
			const q = 'INSERT INTO currentversion (version) VALUES (0)';
			db.query( q, ( err, rows, fields ) => {
				if ( err ) {
					reject( err );
				} else {
					resolve( doWeHave );
				}
			} );
		}
	} );
};

const checkVersionFindVersion = (): Promise<number> => {
	return new Promise( ( resolve, reject ) => {
		const q = 'SELECT version FROM currentversion';
		db.query( q, ( err, rows, fields ) => {
			if ( err ) {
				reject( err );
			} else {
				let currentVersion = 0;
				rows.map( ( curTuple: any ) => currentVersion = curTuple.version );
				resolve( currentVersion );
			}
		} );
	} );
};

*/
