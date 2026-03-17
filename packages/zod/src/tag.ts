import { z } from "zod";

export const createTagSchema = z.object({
	name: z.string().min(1, "Tag name is required").max(100),
	color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
});

export type CreateTagForm = z.infer<typeof createTagSchema>;

export const assignTagSchema = z.object({
	tagId: z.string().uuid(),
});

export type AssignTagForm = z.infer<typeof assignTagSchema>;
