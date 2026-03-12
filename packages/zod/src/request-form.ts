import { z } from "zod";

export const createRequestFormSchema = z.object({
	name: z.string().min(1, "Name is required"),
	description: z.string().optional(),
});

export const updateRequestFormSchema = z.object({
	name: z.string().min(1, "Name is required").optional(),
	description: z.string().optional(),
});

export type CreateRequestFormForm = z.infer<typeof createRequestFormSchema>;
export type UpdateRequestFormForm = z.infer<typeof updateRequestFormSchema>;
