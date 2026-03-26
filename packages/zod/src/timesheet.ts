import { z } from "zod";

export const createTimesheetEntrySchema = z.object({
	jobId: z.string().uuid().optional(),
	category: z.enum(["general", "job", "break"]).default("general"),
	date: z.string().min(1),
	startTime: z.string().optional(),
	endTime: z.string().optional(),
	durationMinutes: z.number().int().min(0).default(0),
	notes: z.string().optional(),
});

export type CreateTimesheetEntryForm = z.infer<typeof createTimesheetEntrySchema>;

export const updateTimesheetEntrySchema = z.object({
	jobId: z.string().uuid().nullable().optional(),
	category: z.enum(["general", "job", "break"]).optional(),
	date: z.string().optional(),
	startTime: z.string().optional(),
	endTime: z.string().optional(),
	durationMinutes: z.number().int().min(0).optional(),
	notes: z.string().optional(),
});

export type UpdateTimesheetEntryForm = z.infer<typeof updateTimesheetEntrySchema>;

export const approveTimesheetsSchema = z.object({
	userIds: z.array(z.string().uuid()),
	approveTo: z.string().min(1),
});

export type ApproveTimesheetsForm = z.infer<typeof approveTimesheetsSchema>;

export const confirmPayrollSchema = z.object({
	userId: z.string().uuid(),
	periodStart: z.string().min(1),
	periodEnd: z.string().min(1),
});

export type ConfirmPayrollForm = z.infer<typeof confirmPayrollSchema>;
