import { z } from "zod";

export const createVisitSchema = z.object({
	title: z.string().min(1, "Title is required"),
	instructions: z.string().optional(),
	startDate: z.string().optional(),
	endDate: z.string().optional(),
	startTime: z.string().optional(),
	endTime: z.string().optional(),
	scheduleLater: z.boolean().optional(),
	anytime: z.boolean().optional(),
	assignedTo: z.string().optional(),
	emailOnAssign: z.boolean().optional(),
	teamReminder: z.enum(["none", "at_start", "30min", "1hour", "2hour", "5hour", "24hour"]).optional(),
});

export type CreateVisitForm = z.infer<typeof createVisitSchema>;
