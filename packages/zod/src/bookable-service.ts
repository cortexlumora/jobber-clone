import { z } from "zod";

export const createBookableServiceSchema = z.object({
	name: z.string().min(1, "Name is required"),
	description: z.string().optional(),
	durationMinutes: z.number().int().min(1).default(60),
	price: z.string().default("0"),
});

export const updateBookableServiceSchema = z.object({
	name: z.string().min(1).optional(),
	description: z.string().optional(),
	durationMinutes: z.number().int().min(1).optional(),
	price: z.string().optional(),
});

export type CreateBookableServiceForm = z.infer<typeof createBookableServiceSchema>;
export type UpdateBookableServiceForm = z.infer<typeof updateBookableServiceSchema>;
