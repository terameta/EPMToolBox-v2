export enum ATStreamType {
	'RDBT' = 1,
	'HPDB' = 2
}

export function getStreamTypeDescription( typecode: number | string ) {
	switch ( typecode ) {
		case 1:
		case '1':
		case 'RDBT': {
			return 'Relational Database Table/View';
		}
		case 2:
		case '2':
		case 'HPDB': {
			return 'Hyperion Planning Database';
		}
	}
}
