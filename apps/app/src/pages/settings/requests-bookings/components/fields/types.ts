export type FieldType =
	| "short_answer"
	| "long_answer"
	| "dropdown_multi"
	| "dropdown_single"
	| "checkbox"
	| "radio"
	| "number"
	| "image_upload"
	| "yes_no"
	| "date"
	| "area"
	| "address"
	| "company_name"
	| "email"
	| "phone"
	| "lead_source"
	| "products_services"
	| "name_group";

export interface FormField {
	id: string;
	type: FieldType;
	label: string;
	required?: boolean;
	options?: string[];
	unit?: string;
}

export interface FieldRendererProps {
	field: FormField;
	isEditing?: boolean;
	onUpdate?: (updates: Partial<FormField>) => void;
}
