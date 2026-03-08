import { z } from "zod";

export const jobLineItemSchema = z.object({
	name: z.string().min(1, "Name is required"),
	description: z.string().optional(),
	qty: z.number().int().min(1).default(1),
	unitCost: z.number().min(0).default(0),
	unitPrice: z.number().min(0).default(0),
	imageFileId: z.string().optional(),
});

export const createJobSchema = z.object({
	title: z.string().min(1, "Title is required"),
	clientId: z.string().min(1, "Client is required"),
	jobNumber: z.string().optional(),
	salesperson: z.string().optional(),
	jobType: z.enum(["one_off", "recurring"]).default("one_off"),
	// Schedule
	startDate: z.string().optional(),
	startTime: z.string().optional(),
	endTime: z.string().optional(),
	// Recurring
	repeats: z.string().optional(),
	repeatDays: z.array(z.string()).optional(),
	endsType: z.enum(["after", "on"]).optional(),
	endsAfterVisits: z.number().int().min(1).optional(),
	endsOnDate: z.string().optional(),
	visitInstructions: z.string().optional(),
	// Team
	assignedUserIds: z.array(z.string()).optional(),
	// Billing (recurring)
	billingType: z.enum(["visit_based", "fixed_price"]).optional(),
	invoiceFrequency: z.string().optional(),
	autoPay: z.boolean().optional(),
	// Line items
	lineItems: z.array(jobLineItemSchema).optional(),
	// Notes
	notes: z.string().optional(),
	noteFileIds: z.array(z.string()).optional(),
	// Link to related
	relatedQuoteId: z.string().optional(),
	relatedRequestId: z.string().optional(),
});

export type CreateJobForm = z.infer<typeof createJobSchema>;
