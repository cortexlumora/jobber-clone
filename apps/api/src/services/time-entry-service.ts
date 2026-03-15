import db, { timeEntriesSchema } from "@repo/db";
import type { CreateTimeEntryForm } from "@repo/zod/time-entry";
import type { PaginationQuery } from "@repo/zod/pagination";
import { eq, sql } from "drizzle-orm";

export async function createTimeEntry(jobId: string, data: CreateTimeEntryForm) {
	const durationMinutes = data.hours * 60 + data.minutes;
	const totalCost = (durationMinutes / 60) * data.employeeCostPerHour;

	const [entry] = await db
		.insert(timeEntriesSchema)
		.values({
			jobId,
			startTime: data.startTime || null,
			endTime: data.endTime || null,
			durationMinutes,
			notes: data.notes || null,
			date: data.date,
			employee: data.employee,
			employeeCostPerHour: String(data.employeeCostPerHour),
			totalCost: String(totalCost.toFixed(2)),
		})
		.returning();

	return entry;
}

export async function getTimeEntriesByJobId(jobId: string, pagination: PaginationQuery) {
	const { page, limit } = pagination;
	const offset = (page - 1) * limit;

	const where = eq(timeEntriesSchema.jobId, jobId);

	const [data, [{ count }]] = await Promise.all([
		db.select().from(timeEntriesSchema).where(where).limit(limit).offset(offset).orderBy(timeEntriesSchema.createdAt),
		db.select({ count: sql<number>`count(*)` }).from(timeEntriesSchema).where(where),
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

export async function deleteTimeEntry(id: string) {
	await db.delete(timeEntriesSchema).where(eq(timeEntriesSchema.id, id));
}
