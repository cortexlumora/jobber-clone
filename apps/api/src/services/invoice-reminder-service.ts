import db, { invoiceRemindersSchema } from "@repo/db";
import type { CreateInvoiceReminderForm } from "@repo/zod/invoice-reminder";
import type { PaginationQuery } from "@repo/zod/pagination";
import { desc, eq, sql } from "drizzle-orm";
import { createReminderSchedule, deleteReminderSchedule } from "../lib/scheduler";

export async function createInvoiceReminder(jobId: string, data: CreateInvoiceReminderForm) {
	const [reminder] = await db
		.insert(invoiceRemindersSchema)
		.values({
			jobId,
			details: data.details || null,
			startDate: data.startDate || null,
			endDate: data.endDate || null,
			startTime: data.startTime || null,
			endTime: data.endTime || null,
			scheduleLater: data.scheduleLater,
			allDay: data.allDay,
			assignedUserIds: data.assignedUserIds ?? null,
			emailTeam: data.emailTeam,
		})
		.returning();

	// Create EventBridge schedule if not scheduling later and has a start date/time
	if (!data.scheduleLater && data.startDate && data.teamReminder !== "none") {
		const scheduleResult = await createReminderSchedule({
			type: "invoice_reminder",
			entityId: reminder.id,
			startDate: data.startDate,
			startTime: data.startTime || "09:00",
			teamReminder: data.teamReminder,
		});

		if (scheduleResult) {
			await db
				.update(invoiceRemindersSchema)
				.set({
					status: "scheduled",
				})
				.where(eq(invoiceRemindersSchema.id, reminder.id));
		}
	}

	return reminder;
}

export async function getInvoiceRemindersByJobId(jobId: string, pagination: PaginationQuery) {
	const { page, limit } = pagination;
	const offset = (page - 1) * limit;

	const where = eq(invoiceRemindersSchema.jobId, jobId);

	const [data, [{ count }]] = await Promise.all([
		db.select().from(invoiceRemindersSchema).where(where).orderBy(desc(invoiceRemindersSchema.createdAt), desc(invoiceRemindersSchema.id)).limit(limit).offset(offset),
		db.select({ count: sql<number>`count(*)` }).from(invoiceRemindersSchema).where(where),
	]);

	return {
		data,
		pagination: {
			page,
			limit,
			total: Number(count),
			totalPages: Math.ceil(Number(count) / limit),
		},
	};
}

export async function deleteInvoiceReminder(id: string) {
	const scheduleName = `reminder-invoice-${id}`;
	await deleteReminderSchedule(scheduleName);
	await db.delete(invoiceRemindersSchema).where(eq(invoiceRemindersSchema.id, id));
}
