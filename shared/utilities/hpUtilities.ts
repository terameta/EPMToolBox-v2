export const findMember = ( memberList: any[], member: string ) => memberList.filter( mbr => mbr.RefField === member );
export const findChildren = ( memberList: any[], member: string ) => memberList.filter( mbr => mbr.Parent === member );
export const findDescendants = ( memberList: any[], member: string, currentList: any[] = [] ) => {
	const children = findChildren( memberList, member );
	children.forEach( child => {
		currentList.push( child );
		findDescendants( memberList, child.RefField, currentList );
	} );
	return currentList;
};
export const findLevel0 = ( memberList: any[], member: string ) => findDescendants( memberList, member ).filter( element => isLevel0( memberList, element.RefField ) );
export const isLevel0 = ( memberList: any[], member: string ) => memberList.findIndex( element => element.Parent === member ) < 0;
export const countMembers = ( memberList: any[], type: string, member: string ) => {
	let count = 0;
	if ( member ) {
		if ( type === 'member' ) {
			count = 1;
		}
		if ( type === 'level0' ) {
			count = findLevel0( memberList, member ).length;
		}
		if ( type === 'children' ) {
			count = findChildren( memberList, member ).length;
		}
		if ( type === 'ichildren' ) {
			count = findChildren( memberList, member ).length + 1;
		}
		if ( type === 'descendants' ) {
			count = findDescendants( memberList, member ).length;
		}
		if ( type === 'idescendants' ) {
			count = findDescendants( memberList, member ).length + 1;
		}
	}
	return count;
};
export const findMembers = ( memberList: any[], type: string, member: string ) => {
	if ( member ) {
		if ( type === 'member' ) return findMember( memberList, member );
		if ( type === 'level0' ) return findLevel0( memberList, member );
		if ( type === 'children' ) return findChildren( memberList, member );
		if ( type === 'ichildren' ) return [member, ...findChildren( memberList, member )];
		if ( type === 'descendants' ) return findDescendants( memberList, member );
		if ( type === 'idescendants' ) return [member, ...findDescendants( memberList, member )];
	}
	return null;
};

export const getPBCSReadDataSelections = ( payload: { selectedMember: string, selectionType: string } ): string => {
	if ( payload.selectionType === 'member' ) return payload.selectedMember;
	if ( payload.selectionType === 'level0' ) return 'ILvl0Descendants(' + payload.selectedMember + ')';
	if ( payload.selectionType === 'children' ) return 'Children(' + payload.selectedMember + ')';
	if ( payload.selectionType === 'ichildren' ) return 'Children(' + payload.selectedMember + '), ' + payload.selectedMember;
	if ( payload.selectionType === 'descendants' ) return 'Descendants(' + payload.selectedMember + ')';
	if ( payload.selectionType === 'idescendants' ) return 'Descendants(' + payload.selectedMember + '), ' + payload.selectedMember;
};
