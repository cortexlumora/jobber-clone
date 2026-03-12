import { z } from "zod";

const formFieldSchema = z.object({
	id: z.string(),
	type: z.string(),
	label: z.string(),
	required: z.boolean().optional(),
	options: z.array(z.string()).optional(),
	unit: z.string().optional(),
});

const formSectionSchema = z.object({
	id: z.string(),
	title: z.string(),
	fields: z.array(formFieldSchema),
});

export const formConfigSchema = z.object({
	sections: z.array(formSectionSchema),
});

export const createRequestFormSchema = z.object({
	name: z.string().min(1, "Name is required"),
	description: z.string().optional(),
	config: formConfigSchema.optional(),
});

export const updateRequestFormSchema = z.object({
	name: z.string().min(1, "Name is required").optional(),
	description: z.string().optional(),
	config: formConfigSchema.optional(),
});

export type CreateRequestFormForm = z.infer<typeof createRequestFormSchema>;
export type UpdateRequestFormForm = z.infer<typeof updateRequestFormSchema>;
