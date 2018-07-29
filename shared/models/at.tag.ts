export interface ATTag {
	id: number,
	name: string,
	description: string,
	taggroup: number
}

export interface ATTagSubject {
	[key: number]: ATTag
}

export interface ATTagConcept {
	subject: ATTagSubject,
	ids: number[]
}

export const ATTagConceptDefault = (): ATTagConcept => ( { subject: {}, ids: [] } );
