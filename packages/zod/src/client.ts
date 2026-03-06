import { z } from "zod";

export const createClientSchema = z.object({
	firstName: z.string().min(1, "First name is required"),
	lastName: z.string().min(1, "Last name is required"),
	company: z.string().optional(),
	email: z.email("Invalid email address"),
	phone: z.string().optional(),
	address: z.string().optional(),
	city: z.string().optional(),
	state: z.string().optional(),
	zip: z.string().optional(),
	status: z.enum(["lead", "active", "inactive"]),
	notes: z.string().optional(),
});

export type CreateClientForm = z.infer<typeof createClientSchema>;
