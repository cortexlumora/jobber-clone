import type { LineItemImageDTO } from "./quote";

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
