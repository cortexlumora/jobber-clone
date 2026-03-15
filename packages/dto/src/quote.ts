import type { PaginatedResponse } from "./common";
import type { ClientNoteDTO } from "./client-note";

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
	clientNotes: PaginatedResponse<ClientNoteDTO>;
	// Timestamps
	createdAt: Date;
	updatedAt: Date;
	deletedAt: Date | null;
}
