import { z } from "zod";

export const createProductServiceSchema = z.object({
	name: z.string().min(1, "Name is required"),
	description: z.string().optional(),
	type: z.string().default("service"),
	cost: z.string().default("0"),
	markup: z.string().default("0"),
	unitPrice: z.string().default("0"),
	taxExempt: z.boolean().default(false),
	onlineBooking: z.boolean().default(false),
});

export const updateProductServiceSchema = z.object({
	name: z.string().min(1).optional(),
	description: z.string().optional(),
	type: z.string().optional(),
	cost: z.string().optional(),
	markup: z.string().optional(),
	unitPrice: z.string().optional(),
	taxExempt: z.boolean().optional(),
	onlineBooking: z.boolean().optional(),
});

export type CreateProductServiceForm = z.infer<typeof createProductServiceSchema>;
export type UpdateProductServiceForm = z.infer<typeof updateProductServiceSchema>;
