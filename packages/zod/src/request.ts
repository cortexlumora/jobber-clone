import { z } from "zod";

export const createRequestSchema = z.object({
	title: z.string().min(1, "Title is required"),
	clientId: z.string().uuid("Client is required"),
	serviceDescription: z.string().min(1, "Service description is required"),
	internalNotes: z.string().optional(),
	fileIds: z.array(z.string().uuid()).optional(),
});

export type CreateRequestForm = z.infer<typeof createRequestSchema>;
