import { z } from "zod";

export const quoteLineItemSchema = z.object({
	type: z.enum(["line_item", "text"]),
	name: z.string().min(1, "Name is required"),
	description: z.string().optional(),
	qty: z.number().int().min(0).default(0),
	unitPrice: z.number().min(0).default(0),
	imageFileId: z.string().uuid().optional(),
});

export const quotePaymentSchema = z.object({
	label: z.string().min(1),
	amount: z.string().default(""),
	description: z.string().default(""),
});

export const createQuoteSchema = z.object({
	title: z.string().min(1, "Title is required"),
	clientId: z.string().uuid("Client is required"),
	quoteNumber: z.string().optional(),
	salesperson: z.string().optional(),
	// Introduction
	introTitle: z.string().optional(),
	introDescription: z.string().optional(),
	introImageFileId: z.string().uuid().optional(),
	// Line items
	lineItems: z.array(quoteLineItemSchema).optional(),
	// Pricing
	discount: z.string().optional(),
	tax: z.string().optional(),
	// Deposit / Payment Schedule
	depositType: z.enum(["none", "deposit", "schedule"]).default("none"),
	depositMode: z.enum(["%", "$"]).default("%"),
	depositValue: z.string().optional(),
	scheduleMode: z.enum(["%", "$"]).default("%"),
	payments: z.array(quotePaymentSchema).optional(),
	// Attachments & Images
	attachmentFileIds: z.array(z.string().uuid()).optional(),
	imageFileIds: z.array(z.string().uuid()).optional(),
	// Content
	clientMessage: z.string().optional(),
	contract: z.string().optional(),
	applyContractToAll: z.boolean().optional(),
	// Notes
	notes: z.string().optional(),
	noteFileIds: z.array(z.string().uuid()).optional(),
	// Link to related
	relatedRequestId: z.string().uuid().optional(),
});

export type CreateQuoteForm = z.infer<typeof createQuoteSchema>;

export const updateQuoteLineItemsSchema = z.object({
	lineItems: z.array(quoteLineItemSchema),
});

export type UpdateQuoteLineItemsForm = z.infer<typeof updateQuoteLineItemsSchema>;

export const updateQuoteFilesSchema = z.object({
	category: z.enum(["attachment", "image", "note"]),
	addedFileIds: z.array(z.string().uuid()),
	removedFileIds: z.array(z.string().uuid()),
});

export type UpdateQuoteFilesForm = z.infer<typeof updateQuoteFilesSchema>;
