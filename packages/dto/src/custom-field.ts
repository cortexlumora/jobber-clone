export interface CustomFieldDefinitionDTO {
	id: string;
	userId: string;
	name: string;
	fieldType: "text" | "number" | "dropdown" | "checkbox" | "date";
	appliesTo: "client" | "property" | "request" | "job" | "quote" | "invoice" | "team";
	defaultValue: string | null;
	options: string[] | null;
	sortOrder: number;
	createdAt: Date;
	updatedAt: Date;
}

export interface CustomFieldValueDTO {
	id: string;
	customFieldId: string;
	entityType: string;
	entityId: string;
	value: string | null;
	createdAt: Date;
	updatedAt: Date;
}
