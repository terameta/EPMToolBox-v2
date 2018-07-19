import { TableDefiner } from 'shared/models/mysql.table.definer';
import { hashSync } from 'bcrypt';

export const users: TableDefiner = {
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
	values: [{ username: 'admin', password: hashSync( 'interesting', 10 ), role: 'admin', type: 'local' }],
	fieldsToCheck: ['username', 'role']
};

export const environmenttypes: TableDefiner = {
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

export const environments: TableDefiner = {
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

export const streams: TableDefiner = {
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

export const streamtypes: TableDefiner = {
	name: 'streamtypes',
	fields: ['id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT',
		'name varchar(255) NOT NULL',
		'value varchar(255) NOT NULL'],
	primaryKey: 'id',
	values: [{ name: 'Planning Database', value: 'HPDB' },
	{ name: 'Relational Database Table/View', value: 'RDBT' }],
	fieldsToCheck: ['name', 'value']
};

export const streamfields: TableDefiner = {
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

export const streampreprocesses: TableDefiner = {
	name: 'streampreprocesses',
	fields: ['id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT',
		'pQuery varchar(20000)',
		'pOrder INT UNSIGNED',
		'stream BIGINT UNSIGNED'],
	primaryKey: 'id'
};

export const maps: TableDefiner = {
	name: 'maps',
	fields: ['id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT',
		'name varchar(255) NOT NULL',
		'type BIGINT UNSIGNED',
		'source BIGINT UNSIGNED',
		'target BIGINT UNSIGNED'],
	primaryKey: 'id'
};

export const maptypes: TableDefiner = {
	name: 'maptypes',
	fields: ['id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT',
		'name varchar(255) NOT NULL',
		'value varchar(255) NOT NULL'],
	primaryKey: 'id',
	values: [{ name: 'Intersection Based Map', value: 'IBM' },
	{ name: 'Segment Based Map', value: 'SBM' }],
	fieldsToCheck: ['name', 'value']
};

export const mapfields: TableDefiner = {
	name: 'mapfields',
	fields: ['id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT',
		'map BIGINT UNSIGNED',
		'srctar varchar(6)',
		'name varchar(255)'],
	primaryKey: 'id'
};

export const logs: TableDefiner = {
	name: 'logs',
	fields: ['id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT',
		'parent BIGINT UNSIGNED',
		'start DATETIME',
		'end DATETIME',
		'details BLOB'],
	primaryKey: 'id'
};

export const processes: TableDefiner = {
	name: 'processes',
	fields: ['id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT',
		'name varchar(255)',
		'source BIGINT UNSIGNED',
		'target BIGINT UNSIGNED',
		'status varchar(255)'],
	primaryKey: 'id'
};

export const processsteps: TableDefiner = {
	name: 'processsteps',
	fields: ['id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT',
		'process BIGINT UNSIGNED',
		'type varchar(255)',
		'referedid BIGINT UNSIGNED',
		'details BLOB',
		'sOrder INT UNSIGNED'],
	primaryKey: 'id'
};

export const taggroups: TableDefiner = {
	name: 'taggroups',
	fields: ['id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT',
		'name varchar(1024) NOT NULL DEFAULT \'New Tag Group\'',
		'position INT UNSIGNED NOT NULL'
	],
	primaryKey: 'id',
	values: [{ name: 'First Tag Group', position: 0 }],
	fieldsToCheck: ['name']
};

export const tags: TableDefiner = {
	name: 'tags',
	fields: ['id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT',
		'name varchar(1024) NOT NULL DEFAULT \'New Tag\'',
		'description varchar(4096) NOT NULL DEFAULT \'\'',
		'taggroup BIGINT UNSIGNED NULL'
	],
	primaryKey: 'id'
};

export const credentials: TableDefiner = {
	name: 'credentials',
	fields: ['id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT',
		'name varchar(1024) NOT NULL DEFAULT \'New Credential\'',
		'username varchar(4096) NOT NULL DEFAULT \'\'',
		'password varchar(4096) NOT NULL DEFAULT \'\''
	],
	primaryKey: 'id'
};

export const asyncprocesses: TableDefiner = {
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

export const schedules: TableDefiner = {
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

export const userdimeprocesses: TableDefiner = {
	name: 'userdimeprocesses',
	fields: [
		'id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT',
		'user BIGINT UNSIGNED',
		'process BIGINT UNSIGNED'
	],
	primaryKey: 'id'
};

export const matrixfields: TableDefiner = {
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

export const matrices: TableDefiner = {
	name: 'matrices',
	fields: [
		'id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT',
		'name VARCHAR(1024)',
		'map BIGINT UNSIGNED'
	],
	primaryKey: 'id'
};

export const acmservers: TableDefiner = {
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

export const processsteptypes: TableDefiner = {
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

export const secrets: TableDefiner = {
	name: 'secrets',
	fields: ['id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT',
		'secret VARCHAR(4096)',
		'description VARCHAR(4096)',
		'allowedips VARCHAR(4096)'],
	primaryKey: 'id'
};

export const ldapservers: TableDefiner = {
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
export const settings: TableDefiner = {
	name: 'settings',
	fields: ['id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT',
		'name varchar(1024)',
		'value varchar(2048)'],
	primaryKey: 'id'
};

export const processfiltersdatafile: TableDefiner = {
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

export const processfilters: TableDefiner = {
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

export const processdefaulttargets: TableDefiner = {
	name: 'processdefaulttargets',
	fields: ['id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT',
		'process BIGINT UNSIGNED',
		'field varchar(255)',
		'value varchar(255)'],
	primaryKey: 'id'
};

export const tableDef: TableDefiner = {
	name: 'processsteps',
	fields: ['id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT',
		'process BIGINT UNSIGNED',
		'type varchar(255)',
		'referedid BIGINT UNSIGNED',
		'details BLOB',
		'sOrder INT UNSIGNED'],
	primaryKey: 'id'
};
