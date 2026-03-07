import { z } from "zod";

export const createClientSchema = z.object({
	title: z.enum(["none", "Mr.", "Ms.", "Mrs.", "Miss.", "Dr."]),
	firstName: z.string().min(1, "First name is required"),
	lastName: z.string().min(1, "Last name is required"),
	companyName: z.string().optional(),
	useCompanyAsPrimary: z.boolean(),
	phones: z.array(
		z.object({
			type: z.enum(["mobile", "landline"]),
			number: z.string().min(1, "Phone number is required"),
		})
	),
	emails: z.array(
		z.object({
			type: z.enum(["primary", "secondary", "work", "other"]),
			value: z.string().email("Invalid email address"),
		})
	),
	propertyAddress: z.object({
		street1: z.string().optional(),
		street2: z.string().optional(),
		city: z.string().optional(),
		state: z.string().optional(),
		zip: z.string().optional(),
		country: z.string().optional(),
	}),
	billingSameAsProperty: z.boolean(),
	billingAddress: z.object({
		street1: z.string().optional(),
		street2: z.string().optional(),
		city: z.string().optional(),
		state: z.string().optional(),
		zip: z.string().optional(),
		country: z.string().optional(),
	}).optional(),
	leadSource: z.enum(["facebook", "existing_client", "flyer", "google", "instagram", "referral", "other"]).optional(),
	notifications: z.object({
		quoteFollowUp: z.boolean(),
		appointmentReminders: z.boolean(),
		jobFollowUp: z.boolean(),
		invoiceFollowUp: z.boolean(),
	}),
	additionalContacts: z.array(z.object({
		title: z.enum(["none", "Mr.", "Ms.", "Mrs.", "Miss.", "Dr."]),
		firstName: z.string().min(1),
		lastName: z.string().min(1),
		role: z.string().optional(),
		phone: z.string().optional(),
		email: z.string().optional(),
		notifications: z.object({
			quoteFollowUp: z.boolean(),
			invoiceFollowUp: z.boolean(),
			appointmentReminders: z.boolean(),
			jobFollowUp: z.boolean(),
		}),
	})).optional(),
});

export type CreateClientForm = z.infer<typeof createClientSchema>;
