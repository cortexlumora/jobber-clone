import type { LineItemImageDTO } from "./quote";

export interface JobLineItemDTO {
	id: string;
	name: string;
	description: string | null;
	qty: number;
	unitCost: string;
	unitPrice: string;
	image: LineItemImageDTO | null;
	sortOrder: number;
	createdAt: Date;
}

export interface JobDTO {
	id: string;
	userId: string;
	clientId: string;
	title: string;
	jobNumber: string | null;
	salesperson: string | null;
	status: "draft" | "active" | "action_required" | "complete" | "archived";
	jobType: "one_off" | "recurring";
	// Schedule
	startDate: string | null;
	startTime: string | null;
	endTime: string | null;
	// Recurring
	repeats: string | null;
	repeatDays: string[] | null;
	endsType: "after" | "on" | null;
	endsAfterVisits: number | null;
	endsOnDate: string | null;
	visitInstructions: string | null;
	// Team
	assignedUserIds: string[] | null;
	// Billing
	billingType: "visit_based" | "fixed_price" | null;
	invoiceFrequency: string | null;
	autoPay: boolean;
	// Notes
	notes: string | null;
	// Related
	relatedQuoteId: string | null;
	relatedRequestId: string | null;
	// Nested
	lineItems: JobLineItemDTO[];
	fileIds: string[];
	// Timestamps
	createdAt: Date;
	updatedAt: Date;
	deletedAt: Date | null;
}
