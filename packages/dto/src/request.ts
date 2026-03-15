export interface RequestLineItemDTO {
	id: string;
	requestId: string;
	name: string;
	description: string | null;
	qty: number;
	unitPrice: string;
	imageFileId: string | null;
	createdAt: Date;
}

export interface RequestFileDTO {
	id: string;
	name: string;
	contentType: string;
	url: string;
}

export interface RequestPropertyDTO {
	id: string;
	street1: string | null;
	street2: string | null;
	city: string | null;
	state: string | null;
	zip: string | null;
}

export interface RequestClientDTO {
	id: string;
	title: string;
	firstName: string;
	lastName: string;
	companyName: string | null;
	useCompanyAsPrimary: boolean;
	phones: { type: string; number: string }[];
	emails: { type: string; value: string }[];
	leadSource: string | null;
	property: RequestPropertyDTO | null;
}

export interface RequestDTO {
	id: string;
	userId: string;
	clientId: string;
	title: string;
	serviceDescription: string;
	status: "new" | "assessed" | "converted" | "archived";
	assessmentInstructions: string | null;
	assessmentStartDate: string | null;
	assessmentEndDate: string | null;
	assessmentStartTime: string | null;
	assessmentEndTime: string | null;
	scheduleLater: boolean;
	anytime: boolean;
	teamReminder: "none" | "at_start" | "30min" | "1hour" | "2hour" | "5hour" | "24hour";
	lineItems: RequestLineItemDTO[];
	internalNotes: string | null;
	fileIds: string[];
	files: RequestFileDTO[];
	client: RequestClientDTO | null;
	createdAt: Date;
	updatedAt: Date;
	deletedAt: Date | null;
}
