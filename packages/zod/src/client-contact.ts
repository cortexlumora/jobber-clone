import { z } from "zod";

export const createClientContactSchema = z.object({
	title: z.enum(["none", "Mr.", "Ms.", "Mrs.", "Miss.", "Dr."]),
	firstName: z.string().min(1, "First name is required"),
	lastName: z.string().min(1, "Last name is required"),
	role: z.string().optional(),
	phone: z.string().optional(),
	email: z.string().email("Invalid email").optional().or(z.literal("")),
	notifications: z.object({
		quoteFollowUp: z.boolean(),
		invoiceFollowUp: z.boolean(),
		appointmentReminders: z.boolean(),
		jobFollowUp: z.boolean(),
	}),
});

export type CreateClientContactForm = z.infer<typeof createClientContactSchema>;
