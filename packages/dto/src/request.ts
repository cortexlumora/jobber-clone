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

export interface RequestAttachmentDTO {
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

export interface RequestAssessmentDTO {
	instructions: string | null;
	startDate: string | null;
	endDate: string | null;
	startTime: string | null;
	endTime: string | null;
	scheduleLater: boolean;
	anytime: boolean;
	teamReminder: "none" | "at_start" | "30min" | "1hour" | "2hour" | "5hour" | "24hour";
}

export interface RequestDTO {
	id: string;
	clientId: string;
	title: string;
	serviceDescription: string;
	status: "new" | "assessed" | "converted" | "archived";
	assessment: RequestAssessmentDTO;
	lineItems: RequestLineItemDTO[];
	attachments: RequestAttachmentDTO[];
	client: RequestClientDTO | null;
	createdAt: Date;
}
