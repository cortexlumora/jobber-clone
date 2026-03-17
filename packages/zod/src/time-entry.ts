import { z } from "zod";

export const createTimeEntrySchema = z.object({
	startTime: z.string().optional(),
	endTime: z.string().optional(),
	hours: z.coerce.number().int().min(0).default(0),
	minutes: z.coerce.number().int().min(0).max(59).default(0),
	notes: z.string().optional(),
	date: z.string().min(1, "Date is required"),
	employee: z.string().min(1, "Employee is required"),
	employeeCostPerHour: z.coerce.number().min(0).default(0),
});

export type CreateTimeEntryForm = z.infer<typeof createTimeEntrySchema>;
