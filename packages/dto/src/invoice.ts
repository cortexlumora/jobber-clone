import type { LineItemImageDTO } from "./quote";

export interface InvoiceStatsDTO {
	pastDueCount: number;
	pastDueAmount: number;
	sentCount: number;
	sentAmount: number;
	draftCount: number;
	draftAmount: number;
	issuedLast30: number;
	issuedLast30Change: number;
	avgInvoiceLast30: number;
}

export interface InvoiceReminderDTO {
	id: string;
	jobId: string;
	details: string | null;
	startDate: string | null;
	endDate: string | null;
	startTime: string | null;
	endTime: string | null;
	scheduleLater: boolean;
	allDay: boolean;
	assignedUserIds: string[] | null;
	emailTeam: boolean;
	status: "scheduled" | "completed" | "cancelled";
	createdAt: Date;
	updatedAt: Date;
}

export interface InvoiceListItemDTO {
	id: string;
	clientId: string;
	jobId: string | null;
	invoiceNumber: string | null;
	status: "draft" | "sent" | "paid" | "partial" | "overdue" | "void";
	subject: string | null;
	dueDate: string | null;
	total: string;
	balance: string;
	createdAt: Date;
	client: {
		title: string;
		firstName: string;
		lastName: string;
		companyName: string | null;
		useCompanyAsPrimary: boolean;
	} | null;
}

export interface InvoiceLineItemDTO {
	id: string;
	name: string;
	description: string | null;
	qty: number;
	unitPrice: string;
	image: LineItemImageDTO | null;
	sortOrder: number;
	createdAt: Date;
}

export interface InvoiceDTO {
	id: string;
	clientId: string;
	jobId: string | null;
	invoiceNumber: string | null;
	status: "draft" | "sent" | "paid" | "partial" | "overdue" | "void";
	subject: string | null;
	issuedDate: string | null;
	dueDate: string | null;
	discount: string | null;
	tax: string | null;
	clientMessage: string | null;
	subtotal: string;
	total: string;
	amountPaid: string;
	balance: string;
	lineItems: InvoiceLineItemDTO[];
	createdAt: Date;
	updatedAt: Date;
	deletedAt: Date | null;
}
