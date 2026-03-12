import { z } from "zod";

const businessDaySchema = z.object({
	enabled: z.boolean(),
	open: z.string(),
	close: z.string(),
});

export const updateCompanySettingsSchema = z.object({
	companyName: z.string().optional(),
	phone: z.string().optional(),
	websiteUrl: z.string().optional(),
	email: z.string().optional(),
	street1: z.string().optional(),
	street2: z.string().optional(),
	city: z.string().optional(),
	state: z.string().optional(),
	zip: z.string().optional(),
	businessHours: z.record(z.string(), businessDaySchema).optional(),
	showBusinessHours: z.boolean().optional(),
	taxIdName: z.string().optional(),
	taxIdNumber: z.string().optional(),
	country: z.string().optional(),
	timezone: z.string().optional(),
	dateFormat: z.string().optional(),
	timeFormat: z.string().optional(),
	firstDayOfWeek: z.string().optional(),
});

export type UpdateCompanySettingsForm = z.infer<typeof updateCompanySettingsSchema>;
