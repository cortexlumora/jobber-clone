import type { PaginatedResponse } from "./common";
import type { ClientNoteDTO } from "./client-note";

export interface QuoteStatsDTO {
	draftCount: number;
	awaitingCount: number;
	approvedCount: number;
	sentLast30: number;
	sentLast30Change: number;
	convertedLast30: number;
	convertedLast30Change: number;
}

export interface QuoteListItemDTO {
	id: string;
	clientId: string;
	title: string;
	quoteNumber: string | null;
	salesperson: string | null;
	status: "draft" | "sent" | "approved" | "rejected" | "archived";
	discount: string | null;
	tax: string | null;
	total: number;
	createdAt: Date;
	client: {
		title: string;
		firstName: string;
		lastName: string;
		companyName: string | null;
		useCompanyAsPrimary: boolean;
		phones: import("./client").Phone[];
		emails: import("./client").Email[];
	} | null;
	property: {
		street1: string | null;
		street2: string | null;
		city: string | null;
		state: string | null;
		zip: string | null;
	} | null;
}

export interface LineItemImageDTO {
	id: string;
	name: string;
	contentType: string;
	url: string | null;
}

export interface QuoteLineItemDTO {
	id: string;
	type: string;
	name: string;
	description: string | null;
	qty: number;
	unitPrice: string;
	image: LineItemImageDTO | null;
	sortOrder: number;
	createdAt: Date;
}

export interface QuotePaymentDTO {
	label: string;
	amount: string;
	description: string;
}

export interface QuoteFileDTO {
	id: string;
	name: string;
}

export interface QuoteDTO {
	id: string;
	userId: string;
	clientId: string;
	title: string;
	quoteNumber: string | null;
	salesperson: string | null;
	status: "draft" | "sent" | "approved" | "rejected" | "archived";
	// Introduction
	introTitle: string | null;
	introDescription: string | null;
	introImageFileId: string | null;
	introImage: LineItemImageDTO | null;
	// Pricing
	discount: string | null;
	tax: string | null;
	// Deposit / Payment Schedule
	depositType: "none" | "deposit" | "schedule";
	depositMode: "%" | "$";
	depositValue: string | null;
	scheduleMode: "%" | "$";
	payments: QuotePaymentDTO[] | null;
	// Content
	clientMessage: string | null;
	contract: string | null;
	applyContractToAll: boolean;
	// Notes
	notes: string | null;
	// Related data
	lineItems: QuoteLineItemDTO[];
	attachmentFileIds: string[];
	imageFileIds: string[];
	noteFileIds: string[];
	attachments: QuoteFileDTO[];
	images: QuoteFileDTO[];
	noteFiles: QuoteFileDTO[];
	clientNotes: PaginatedResponse<ClientNoteDTO>;
	// Timestamps
	createdAt: Date;
	updatedAt: Date;
	deletedAt: Date | null;
}
