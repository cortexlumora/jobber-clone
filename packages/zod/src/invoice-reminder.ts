import { z } from "zod";

export const createInvoiceReminderSchema = z.object({
	details: z.string().optional(),
	startDate: z.string().optional(),
	endDate: z.string().optional(),
	startTime: z.string().optional(),
	endTime: z.string().optional(),
	scheduleLater: z.boolean().default(false),
	allDay: z.boolean().default(true),
	assignedUserIds: z.array(z.string()).optional(),
	emailTeam: z.boolean().default(false),
	teamReminder: z.string().default("none"),
});

export type CreateInvoiceReminderForm = z.infer<typeof createInvoiceReminderSchema>;
