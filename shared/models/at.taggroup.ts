export interface ATTagGroup {
	id: number,
	name: string,
	position: number,
	isReordered: boolean
}

export interface ATTagGroupSubject {
	[key: number]: ATTagGroup
}

export interface ATTagGroupConcept {
	subject: ATTagGroupSubject,
	ids: number[]
}

export const ATTagGroupConceptDefault = (): ATTagGroupConcept => ( { subject: {}, ids: [] } );
