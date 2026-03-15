import { z } from "zod";

export const invoiceLineItemSchema = z.object({
	name: z.string().min(1, "Name is required"),
	description: z.string().optional(),
	qty: z.number().int().min(1).default(1),
	unitPrice: z.number().min(0).default(0),
	imageFileId: z.string().optional(),
});

export const createInvoiceSchema = z.object({
	clientId: z.string().min(1, "Client is required"),
	jobId: z.string().optional(),
	invoiceNumber: z.string().optional(),
	subject: z.string().optional(),
	issuedDate: z.string().optional(),
	dueDate: z.string().optional(),
	salesperson: z.string().optional(),
	discount: z.string().optional(),
	tax: z.string().optional(),
	clientMessage: z.string().optional(),
	contract: z.string().optional(),
	lineItems: z.array(invoiceLineItemSchema).optional(),
	noteContent: z.string().optional(),
	noteFileIds: z.array(z.string()).optional(),
});

export type CreateInvoiceForm = z.infer<typeof createInvoiceSchema>;
