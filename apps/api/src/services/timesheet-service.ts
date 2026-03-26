import db, { timesheetEntriesSchema, payrollPeriodsSchema, usersSchema, jobsSchema } from "@repo/db";
import type { CreateTimesheetEntryForm, UpdateTimesheetEntryForm, ApproveTimesheetsForm, ConfirmPayrollForm } from "@repo/zod/timesheet";
import type { PaginationQuery } from "@repo/zod/pagination";
import type { TimesheetApprovalSummaryDTO } from "@repo/dto";
import { and, desc, eq, lte, sql } from "drizzle-orm";

// ── Timesheet Entries ────────────────────────────────────────────────

export async function createTimesheetEntry(userId: string, data: CreateTimesheetEntryForm) {
	const [entry] = await db
		.insert(timesheetEntriesSchema)
		.values({
			userId,
			jobId: data.jobId || null,
			category: data.category ?? "general",
			date: data.date,
			startTime: data.startTime || null,
			endTime: data.endTime || null,
			durationMinutes: data.durationMinutes ?? 0,
			notes: data.notes || null,
		})
		.returning();

	return entry;
}

export async function updateTimesheetEntry(entryId: string, userId: string, data: UpdateTimesheetEntryForm) {
	const [entry] = await db
		.update(timesheetEntriesSchema)
		.set({
			...(data.jobId !== undefined && { jobId: data.jobId }),
			...(data.category && { category: data.category }),
			...(data.date && { date: data.date }),
			...(data.startTime !== undefined && { startTime: data.startTime || null }),
			...(data.endTime !== undefined && { endTime: data.endTime || null }),
			...(data.durationMinutes !== undefined && { durationMinutes: data.durationMinutes }),
			...(data.notes !== undefined && { notes: data.notes || null }),
		})
		.where(and(eq(timesheetEntriesSchema.id, entryId), eq(timesheetEntriesSchema.userId, userId)))
		.returning();

	return entry ?? null;
}

export async function deleteTimesheetEntry(entryId: string, userId: string) {
	await db
		.delete(timesheetEntriesSchema)
		.where(and(eq(timesheetEntriesSchema.id, entryId), eq(timesheetEntriesSchema.userId, userId)));
}

export async function getTimesheetEntries(userId: string, date: string, pagination: PaginationQuery) {
	const { page, limit } = pagination;
	const offset = (page - 1) * limit;

	const where = and(eq(timesheetEntriesSchema.userId, userId), eq(timesheetEntriesSchema.date, date));

	const [data, [{ count }]] = await Promise.all([
		db
			.select({
				id: timesheetEntriesSchema.id,
				userId: timesheetEntriesSchema.userId,
				jobId: timesheetEntriesSchema.jobId,
				category: timesheetEntriesSchema.category,
				date: timesheetEntriesSchema.date,
				startTime: timesheetEntriesSchema.startTime,
				endTime: timesheetEntriesSchema.endTime,
				durationMinutes: timesheetEntriesSchema.durationMinutes,
				notes: timesheetEntriesSchema.notes,
				gpsStartCoords: timesheetEntriesSchema.gpsStartCoords,
				gpsEndCoords: timesheetEntriesSchema.gpsEndCoords,
				status: timesheetEntriesSchema.status,
				approvedAt: timesheetEntriesSchema.approvedAt,
				approvedById: timesheetEntriesSchema.approvedById,
				createdAt: timesheetEntriesSchema.createdAt,
				updatedAt: timesheetEntriesSchema.updatedAt,
				jobTitle: jobsSchema.title,
			})
			.from(timesheetEntriesSchema)
			.leftJoin(jobsSchema, eq(timesheetEntriesSchema.jobId, jobsSchema.id))
			.where(where)
			.orderBy(desc(timesheetEntriesSchema.createdAt))
			.limit(limit)
			.offset(offset),
		db.select({ count: sql<number>`count(*)` }).from(timesheetEntriesSchema).where(where),
	]);

	return {
		data,
		pagination: { page, limit, total: Number(count), totalPages: Math.ceil(Number(count) / limit) },
	};
}

export async function getTimesheetEntriesByWeek(userId: string, weekStart: string, weekEnd: string) {
	const data = await db
		.select({
			id: timesheetEntriesSchema.id,
			userId: timesheetEntriesSchema.userId,
			jobId: timesheetEntriesSchema.jobId,
			category: timesheetEntriesSchema.category,
			date: timesheetEntriesSchema.date,
			startTime: timesheetEntriesSchema.startTime,
			endTime: timesheetEntriesSchema.endTime,
			durationMinutes: timesheetEntriesSchema.durationMinutes,
			notes: timesheetEntriesSchema.notes,
			gpsStartCoords: timesheetEntriesSchema.gpsStartCoords,
			gpsEndCoords: timesheetEntriesSchema.gpsEndCoords,
			status: timesheetEntriesSchema.status,
			approvedAt: timesheetEntriesSchema.approvedAt,
			approvedById: timesheetEntriesSchema.approvedById,
			createdAt: timesheetEntriesSchema.createdAt,
			updatedAt: timesheetEntriesSchema.updatedAt,
			jobTitle: jobsSchema.title,
		})
		.from(timesheetEntriesSchema)
		.leftJoin(jobsSchema, eq(timesheetEntriesSchema.jobId, jobsSchema.id))
		.where(
			and(
				eq(timesheetEntriesSchema.userId, userId),
				sql`${timesheetEntriesSchema.date} >= ${weekStart}`,
				sql`${timesheetEntriesSchema.date} <= ${weekEnd}`,
			),
		)
		.orderBy(timesheetEntriesSchema.date, timesheetEntriesSchema.startTime);

	return data;
}

// ── Approve Timesheets ───────────────────────────────────────────────

export async function getPendingApprovals(): Promise<TimesheetApprovalSummaryDTO[]> {
	const rows = await db
		.select({
			userId: timesheetEntriesSchema.userId,
			userName: sql<string>`${usersSchema.name}`,
			date: timesheetEntriesSchema.date,
			totalMinutes: sql<number>`sum(${timesheetEntriesSchema.durationMinutes})`,
		})
		.from(timesheetEntriesSchema)
		.innerJoin(usersSchema, eq(timesheetEntriesSchema.userId, usersSchema.id))
		.where(eq(timesheetEntriesSchema.status, "pending"))
		.groupBy(timesheetEntriesSchema.userId, usersSchema.name, timesheetEntriesSchema.date)
		.orderBy(timesheetEntriesSchema.date);

	const byUser = new Map<string, TimesheetApprovalSummaryDTO>();

	for (const row of rows) {
		if (!byUser.has(row.userId)) {
			const initials = row.userName.split(" ").map((n: string) => n[0]).join("").toUpperCase();
			byUser.set(row.userId, {
				userId: row.userId,
				userName: row.userName,
				userInitials: initials,
				totalMinutes: 0,
				entries: [],
			});
		}
		const user = byUser.get(row.userId)!;
		const d = new Date(row.date + "T00:00:00");
		const dayOfWeek = d.toLocaleDateString("en-US", { weekday: "long" });
		const minutes = Number(row.totalMinutes);
		user.totalMinutes += minutes;
		user.entries.push({
			date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
			dayOfWeek,
			minutes,
		});
	}

	return Array.from(byUser.values());
}

export async function approveTimesheets(approvedById: string, data: ApproveTimesheetsForm) {
	await db
		.update(timesheetEntriesSchema)
		.set({
			status: "approved",
			approvedAt: new Date(),
			approvedById,
		})
		.where(
			and(
				eq(timesheetEntriesSchema.status, "pending"),
				lte(timesheetEntriesSchema.date, data.approveTo),
				sql`${timesheetEntriesSchema.userId} = ANY(${data.userIds})`,
			),
		);
}

// ── Payroll ──────────────────────────────────────────────────────────

export async function getPayrollSummary() {
	const rows = await db
		.select({
			userId: timesheetEntriesSchema.userId,
			userName: sql<string>`${usersSchema.name}`,
			totalMinutes: sql<number>`sum(${timesheetEntriesSchema.durationMinutes})`,
		})
		.from(timesheetEntriesSchema)
		.innerJoin(usersSchema, eq(timesheetEntriesSchema.userId, usersSchema.id))
		.where(eq(timesheetEntriesSchema.status, "approved"))
		.groupBy(timesheetEntriesSchema.userId, usersSchema.name);

	return rows.map((row) => {
		const initials = row.userName.split(" ").map((n: string) => n[0]).join("").toUpperCase();
		return {
			userId: row.userId,
			userName: row.userName,
			userInitials: initials,
			totalMinutes: Number(row.totalMinutes),
			expenses: "0.00",
			status: "awaiting_payment" as const,
		};
	});
}

export async function confirmPayroll(confirmedById: string, data: ConfirmPayrollForm) {
	// Get total approved minutes for the user in the period
	const [result] = await db
		.select({
			totalMinutes: sql<number>`coalesce(sum(${timesheetEntriesSchema.durationMinutes}), 0)`,
		})
		.from(timesheetEntriesSchema)
		.where(
			and(
				eq(timesheetEntriesSchema.userId, data.userId),
				eq(timesheetEntriesSchema.status, "approved"),
				sql`${timesheetEntriesSchema.date} >= ${data.periodStart}`,
				sql`${timesheetEntriesSchema.date} <= ${data.periodEnd}`,
			),
		);

	const [period] = await db
		.insert(payrollPeriodsSchema)
		.values({
			userId: data.userId,
			periodStart: data.periodStart,
			periodEnd: data.periodEnd,
			totalMinutes: Number(result.totalMinutes),
			status: "paid",
			confirmedAt: new Date(),
			confirmedById,
		})
		.returning();

	return period;
}

export async function getPayrollPeriods(pagination: PaginationQuery) {
	const { page, limit } = pagination;
	const offset = (page - 1) * limit;

	const [data, [{ count }]] = await Promise.all([
		db
			.select({
				id: payrollPeriodsSchema.id,
				userId: payrollPeriodsSchema.userId,
				userName: sql<string>`${usersSchema.name}`,
				periodStart: payrollPeriodsSchema.periodStart,
				periodEnd: payrollPeriodsSchema.periodEnd,
				totalMinutes: payrollPeriodsSchema.totalMinutes,
				totalExpenses: payrollPeriodsSchema.totalExpenses,
				status: payrollPeriodsSchema.status,
				confirmedAt: payrollPeriodsSchema.confirmedAt,
				createdAt: payrollPeriodsSchema.createdAt,
			})
			.from(payrollPeriodsSchema)
			.innerJoin(usersSchema, eq(payrollPeriodsSchema.userId, usersSchema.id))
			.orderBy(desc(payrollPeriodsSchema.createdAt))
			.limit(limit)
			.offset(offset),
		db.select({ count: sql<number>`count(*)` }).from(payrollPeriodsSchema),
	]);

	return {
		data,
		pagination: { page, limit, total: Number(count), totalPages: Math.ceil(Number(count) / limit) },
	};
}
