export interface ATFieldDescription {
	RefField: string,
	Description: string,
	parent: string
}

export interface ATFieldDescriptionsMap {
	[key: number]: ATFieldDescription[]
}
