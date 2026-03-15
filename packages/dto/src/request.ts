import type { LineItemImageDTO } from "./quote";
import type { PaginatedResponse } from "./common";
import type { ClientNoteDTO } from "./client-note";

export interface RequestLineItemDTO {
	id: string;
	name: string;
	description: string | null;
	qty: number;
	unitPrice: string;
	image: LineItemImageDTO | null;
	createdAt: Date;
}

export interface RequestAttachmentDTO {
	id: string;
	name: string;
	contentType: string;
	url: string;
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
	assessment: RequestAssessmentDTO | null;
	lineItems: RequestLineItemDTO[];
	attachments: RequestAttachmentDTO[];
	client: RequestClientDTO | null;
	clientNotes: PaginatedResponse<ClientNoteDTO>;
	createdAt: Date;
}
