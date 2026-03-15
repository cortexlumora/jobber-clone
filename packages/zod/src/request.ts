import { z } from "zod";

export const lineItemSchema = z.object({
	name: z.string().min(1, "Name is required"),
	description: z.string().optional(),
	qty: z.number().int().min(1).default(1),
	unitPrice: z.number().min(0).default(0),
	imageFileId: z.string().uuid().optional(),
});

export const assessmentSchema = z.object({
	instructions: z.string().optional(),
	startDate: z.string().optional(),
	endDate: z.string().optional(),
	startTime: z.string().optional(),
	endTime: z.string().optional(),
	scheduleLater: z.boolean().optional(),
	anytime: z.boolean().optional(),
	teamReminder: z.enum(["none", "at_start", "30min", "1hour", "2hour", "5hour", "24hour"]).optional(),
});

export type AssessmentForm = z.infer<typeof assessmentSchema>;

export const createRequestSchema = z.object({
	title: z.string().min(1, "Title is required"),
	clientId: z.string().uuid("Client is required"),
	serviceDescription: z.string().min(1, "Service description is required"),
	assessment: assessmentSchema.optional(),
	lineItems: z.array(lineItemSchema).optional(),
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

export const updateRequestAssessmentSchema = assessmentSchema;

export type UpdateRequestAssessmentForm = z.infer<typeof updateRequestAssessmentSchema>;
