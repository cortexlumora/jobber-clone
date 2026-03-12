export interface FormFieldConfigDTO {
	id: string;
	type: string;
	label: string;
	required?: boolean;
	options?: string[];
	unit?: string;
}

export interface FormSectionConfigDTO {
	id: string;
	title: string;
	fields: FormFieldConfigDTO[];
}

export interface FormConfigDTO {
	sections: FormSectionConfigDTO[];
}

export interface RequestFormDTO {
	id: string;
	userId: string;
	name: string;
	description: string | null;
	config: FormConfigDTO | null;
	isDefault: boolean;
	createdAt: Date;
	updatedAt: Date;
}
