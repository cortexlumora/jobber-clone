import { z } from "zod";

export const lineItemSchema = z.object({
	name: z.string().min(1, "Name is required"),
	description: z.string().optional(),
	qty: z.number().int().min(1).default(1),
	unitPrice: z.number().min(0).default(0),
	imageFileId: z.string().uuid().optional(),
});

export const createRequestSchema = z.object({
	title: z.string().min(1, "Title is required"),
	clientId: z.string().uuid("Client is required"),
	serviceDescription: z.string().min(1, "Service description is required"),
	// Assessment
	assessmentInstructions: z.string().optional(),
	assessmentStartDate: z.string().optional(),
	assessmentEndDate: z.string().optional(),
	assessmentStartTime: z.string().optional(),
	assessmentEndTime: z.string().optional(),
	scheduleLater: z.boolean().optional(),
	anytime: z.boolean().optional(),
	teamReminder: z.enum(["none", "at_start", "30min", "1hour", "2hour", "5hour", "24hour"]).optional(),
	// Line items
	lineItems: z.array(lineItemSchema).optional(),
	// Notes & files
	internalNotes: z.string().optional(),
	fileIds: z.array(z.string().uuid()).optional(),
});

export type CreateRequestForm = z.infer<typeof createRequestSchema>;

export const updateRequestOverviewSchema = z.object({
	serviceDescription: z.string().min(1, "Service description is required"),
	fileIds: z.array(z.string().uuid()).optional(),
});

export type UpdateRequestOverviewForm = z.infer<typeof updateRequestOverviewSchema>;

export const updateRequestLineItemsSchema = z.object({
	lineItems: z.array(lineItemSchema),
});

export type UpdateRequestLineItemsForm = z.infer<typeof updateRequestLineItemsSchema>;

export const updateRequestAssessmentSchema = z.object({
	assessmentInstructions: z.string().optional(),
	assessmentStartDate: z.string().optional(),
	assessmentEndDate: z.string().optional(),
	assessmentStartTime: z.string().optional(),
	assessmentEndTime: z.string().optional(),
	scheduleLater: z.boolean().optional(),
	anytime: z.boolean().optional(),
	teamReminder: z.enum(["none", "at_start", "30min", "1hour", "2hour", "5hour", "24hour"]).optional(),
});

export type UpdateRequestAssessmentForm = z.infer<typeof updateRequestAssessmentSchema>;
