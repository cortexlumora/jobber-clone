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
	jobType: z.enum(["one_off", "recurring"]).optional(),
	// Schedule
	startDate: z.string().optional(),
	startTime: z.string().optional(),
	endTime: z.string().optional(),
	scheduleLater: z.boolean().optional(),
	anytime: z.boolean().optional(),
	// Recurring
	repeats: z.string().optional(),
	repeatDay: z.string().optional(),
	endsType: z.enum(["after", "on"]).optional(),
	endsAfterValue: z.string().optional(),
	endsAfterUnit: z.string().optional(),
	endsOnDate: z.string().optional(),
	visitInstructions: z.string().optional(),
	emailTeamAboutAssignment: z.boolean().optional(),
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

export const updateJobLineItemsSchema = z.object({
	lineItems: z.array(jobLineItemSchema),
});

export type UpdateJobLineItemsForm = z.infer<typeof updateJobLineItemsSchema>;
