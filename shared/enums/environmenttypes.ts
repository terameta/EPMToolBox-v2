export enum DimeEnvironmentType {
	'HP' = 1,
	'MSSQL' = 2,
	'PBCS' = 3,
	'ORADB' = 4
}

export function dimeGetEnvironmentTypeDescription( typecode: number | string ) {
	switch ( typecode ) {
		case 1:
		case '1':
		case 'HP': {
			return 'Hyperion Planning On-Premises';
		}
		case 2:
		case '2':
		case 'MSSQL': {
			return 'Microsoft SQL Server';
		}
		case 3:
		case '3':
		case 'PBCS': {
			return 'Hyperion Planning PBCS';
		}
		case 4:
		case '4':
		case 'ORADB': {
			return 'Oracle Database Server';
		}
	}
}
