import { z } from "zod";

export const createCustomFieldSchema = z.object({
	name: z.string().min(1, "Field name is required"),
	fieldType: z.enum(["text", "number", "dropdown", "checkbox", "date"]),
	appliesTo: z.enum(["client", "property", "request", "job", "quote", "invoice", "team"]),
	defaultValue: z.string().optional(),
	options: z.array(z.string()).optional(),
});

export const updateCustomFieldSchema = createCustomFieldSchema.partial().extend({
	sortOrder: z.number().optional(),
});

export const setCustomFieldValueSchema = z.object({
	customFieldId: z.string().uuid(),
	entityType: z.string(),
	entityId: z.string().uuid(),
	value: z.string().nullable(),
});

export const reorderCustomFieldsSchema = z.object({
	items: z.array(z.object({ id: z.string().uuid(), sortOrder: z.number() })),
});

export type ReorderCustomFieldsForm = z.infer<typeof reorderCustomFieldsSchema>;
export type CreateCustomFieldForm = z.infer<typeof createCustomFieldSchema>;
export type UpdateCustomFieldForm = z.infer<typeof updateCustomFieldSchema>;
export type SetCustomFieldValueForm = z.infer<typeof setCustomFieldValueSchema>;
