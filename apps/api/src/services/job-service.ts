import db, { jobsSchema, jobSchedulesSchema, jobLineItemsSchema, filesSchema, visitsSchema, clientsSchema, propertiesSchema, requestsSchema, timeEntriesSchema, expensesSchema } from "@repo/db";
import type { CreateJobForm, UpdateJobLineItemsForm } from "@repo/zod/job";
import type { PaginationQuery } from "@repo/zod/pagination";
import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { signKey } from "./file-service";
import { getTimeEntriesByJobId } from "./time-entry-service";
import { getExpensesByJobId } from "./expense-service";
import { getClientNotes } from "./client-note-service";
import { getInvoicesByJobId } from "./invoice-service";
import { getInvoiceRemindersByJobId } from "./invoice-reminder-service";
import { createJobSchedule, deleteJobSchedule } from "../lib/scheduler";

export async function createJob(userId: string, data: CreateJobForm) {
	const { lineItems, noteFileIds, startDate, startTime, endTime, scheduleLater, anytime, repeats, repeatDay, endsType, endsAfterValue, endsAfterUnit, endsOnDate, visitInstructions, emailTeamAboutAssignment, ...jobData } = data;

	return db.transaction(async (tx) => {
		const [job] = await tx
			.insert(jobsSchema)
			.values({
				userId,
				clientId: jobData.clientId,
				title: jobData.title,
				jobNumber: jobData.jobNumber || null,
				salesperson: jobData.salesperson || null,
				jobType: jobData.jobType ?? "one_off",
				assignedUserIds: jobData.assignedUserIds ?? null,
				billingType: jobData.billingType ?? null,
				invoiceFrequency: jobData.invoiceFrequency || null,
				autoPay: jobData.autoPay ?? false,
				notes: jobData.notes || null,
				relatedQuoteId: jobData.relatedQuoteId || null,
				relatedRequestId: jobData.relatedRequestId || null,
			})
			.returning();

		const [jobSchedule] = await tx.insert(jobSchedulesSchema).values({
			jobId: job.id,
			startDate: startDate || null,
			startTime: startTime || null,
			endTime: endTime || null,
			scheduleLater: scheduleLater ?? false,
			anytime: anytime ?? false,
			repeats: repeats || null,
			repeatDay: repeatDay || null,
			repeatDays: repeatDay ? [repeatDay] : null,
			endsType: endsType ?? null,
			endsAfterValue: endsAfterValue || null,
			endsAfterUnit: endsAfterUnit || null,
			endsOnDate: endsOnDate || null,
			visitInstructions: visitInstructions || null,
			emailTeamAboutAssignment: emailTeamAboutAssignment ?? false,
		}).returning();

		// Create EventBridge schedule if not scheduling later
		if (!scheduleLater && startDate) {
			try {
				const result = await createJobSchedule({
					jobScheduleId: jobSchedule.id,
					jobId: job.id,
					jobType: jobData.jobType ?? "one_off",
					startDate,
					startTime,
					repeats,
					repeatDay,
					endsOnDate,
				});
				await tx.update(jobSchedulesSchema).set({
					scheduleName: result.scheduleName,
					scheduleArn: result.scheduleArn,
					scheduleStatus: "active",
				}).where(eq(jobSchedulesSchema.id, jobSchedule.id));
			} catch (err) {
				console.error("Failed to create EventBridge schedule:", err);
				await tx.update(jobSchedulesSchema).set({ scheduleStatus: "failed" }).where(eq(jobSchedulesSchema.id, jobSchedule.id));
			}
		}

		if (lineItems && lineItems.length > 0) {
			await tx
				.insert(jobLineItemsSchema)
				.values(
					lineItems.map((item, index) => ({
						jobId: job.id,
						name: item.name,
						description: item.description || null,
						qty: item.qty,
						unitCost: String(item.unitCost),
						unitPrice: String(item.unitPrice),
						imageFileId: item.imageFileId || null,
						sortOrder: index,
					})),
				);
		}

		// Mark related request as converted
		if (jobData.relatedRequestId) {
			await tx.update(requestsSchema).set({ status: "converted" }).where(eq(requestsSchema.id, jobData.relatedRequestId));
		}

		return { id: job.id };
	});
}

export async function getJobs(pagination: PaginationQuery) {
	const { page, limit } = pagination;
	const offset = (page - 1) * limit;

	const where = isNull(jobsSchema.deletedAt);

	const [rows, [{ count }]] = await Promise.all([
		db
			.select({
				id: jobsSchema.id,
				clientId: jobsSchema.clientId,
				title: jobsSchema.title,
				jobNumber: jobsSchema.jobNumber,
				salesperson: jobsSchema.salesperson,
				status: jobsSchema.status,
				jobType: jobsSchema.jobType,
				startDate: jobSchedulesSchema.startDate,
				startTime: jobSchedulesSchema.startTime,
				endTime: jobSchedulesSchema.endTime,
				repeats: jobSchedulesSchema.repeats,
				repeatDays: jobSchedulesSchema.repeatDays,
				endsType: jobSchedulesSchema.endsType,
				endsOnDate: jobSchedulesSchema.endsOnDate,
				createdAt: jobsSchema.createdAt,
				client: {
					title: clientsSchema.title,
					firstName: clientsSchema.firstName,
					lastName: clientsSchema.lastName,
					companyName: clientsSchema.companyName,
					useCompanyAsPrimary: clientsSchema.useCompanyAsPrimary,
				},
			})
			.from(jobsSchema)
			.innerJoin(clientsSchema, eq(jobsSchema.clientId, clientsSchema.id))
			.leftJoin(jobSchedulesSchema, eq(jobsSchema.id, jobSchedulesSchema.jobId))
			.where(where)
			.orderBy(desc(jobsSchema.createdAt))
			.limit(limit)
			.offset(offset),
		db.select({ count: sql<number>`count(*)` }).from(jobsSchema).where(where),
	]);

	const clientIds = [...new Set(rows.map((r) => r.clientId))];
	const jobIds = rows.map((r) => r.id);

	const [properties, lineItems] = await Promise.all([
		clientIds.length > 0
			? db.selectDistinctOn([propertiesSchema.clientId], {
					clientId: propertiesSchema.clientId,
					street1: propertiesSchema.street1,
					street2: propertiesSchema.street2,
					city: propertiesSchema.city,
					state: propertiesSchema.state,
					zip: propertiesSchema.zip,
				}).from(propertiesSchema).where(sql`${propertiesSchema.clientId} in ${clientIds}`)
			: Promise.resolve([]),
		jobIds.length > 0
			? db.select({ jobId: jobLineItemsSchema.jobId, qty: jobLineItemsSchema.qty, unitPrice: jobLineItemsSchema.unitPrice }).from(jobLineItemsSchema).where(sql`${jobLineItemsSchema.jobId} in ${jobIds}`)
			: Promise.resolve([]),
	]);

	const propertyMap = new Map(properties.map((p) => [p.clientId, p]));
	const totalMap = new Map<string, number>();
	for (const item of lineItems) {
		totalMap.set(item.jobId, (totalMap.get(item.jobId) ?? 0) + item.qty * Number(item.unitPrice));
	}

	const data = rows.map((row) => ({
		...row,
		client: row.client?.firstName ? row.client : null,
		property: propertyMap.get(row.clientId) ?? null,
		total: totalMap.get(row.id) ?? 0,
	}));

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

async function getJobLineItemsByJobId(jobId: string) {
	const items = await db
		.select({
			id: jobLineItemsSchema.id,
			name: jobLineItemsSchema.name,
			description: jobLineItemsSchema.description,
			qty: jobLineItemsSchema.qty,
			unitCost: jobLineItemsSchema.unitCost,
			unitPrice: jobLineItemsSchema.unitPrice,
			sortOrder: jobLineItemsSchema.sortOrder,
			createdAt: jobLineItemsSchema.createdAt,
			image: {
				id: filesSchema.id,
				name: filesSchema.name,
				contentType: filesSchema.contentType,
				key: filesSchema.key,
			},
		})
		.from(jobLineItemsSchema)
		.leftJoin(filesSchema, eq(jobLineItemsSchema.imageFileId, filesSchema.id))
		.where(eq(jobLineItemsSchema.jobId, jobId));

	return Promise.all(
		items.map(async (item) => ({
			...item,
			image: item.image?.key
				? { id: item.image.id!, name: item.image.name!, contentType: item.image.contentType!, url: await signKey(item.image.key) }
				: null,
		})),
	);
}

async function getJobProfitability(jobId: string) {
	const [result] = await db
		.select({
			totalPrice: sql<number>`coalesce(sum(${jobLineItemsSchema.qty} * ${jobLineItemsSchema.unitPrice}::numeric), 0)`,
			totalCost: sql<number>`coalesce(sum(${jobLineItemsSchema.qty} * ${jobLineItemsSchema.unitCost}::numeric), 0)`,
		})
		.from(jobLineItemsSchema)
		.where(eq(jobLineItemsSchema.jobId, jobId));

	const [laborResult] = await db
		.select({
			totalLabor: sql<number>`coalesce(sum(${timeEntriesSchema.totalCost}::numeric), 0)`,
		})
		.from(timeEntriesSchema)
		.where(eq(timeEntriesSchema.jobId, jobId));

	const [expenseResult] = await db
		.select({
			totalExpenses: sql<number>`coalesce(sum(${expensesSchema.total}::numeric), 0)`,
		})
		.from(expensesSchema)
		.where(eq(expensesSchema.jobId, jobId));

	const totalPrice = Number(result.totalPrice);
	const totalCost = Number(result.totalCost);
	const totalLabor = Number(laborResult.totalLabor);
	const totalExpenses = Number(expenseResult.totalExpenses);
	const profit = totalPrice - totalCost - totalLabor - totalExpenses;
	const profitMargin = totalPrice > 0 ? Math.round((profit / totalPrice) * 100) : 0;

	return { totalPrice, totalCost, totalLabor, totalExpenses, profit, profitMargin };
}

export async function getJobById(jobId: string) {
	const [row] = await db
		.select({ job: jobsSchema, schedule: jobSchedulesSchema })
		.from(jobsSchema)
		.leftJoin(jobSchedulesSchema, eq(jobsSchema.id, jobSchedulesSchema.jobId))
		.where(and(eq(jobsSchema.id, jobId), isNull(jobsSchema.deletedAt)));

	if (!row) return null;
	const { job, schedule: rawSchedule } = row;
	const schedule = rawSchedule ?? {
		startDate: null, startTime: null, endTime: null,
		scheduleLater: false, anytime: false,
		repeats: null, repeatDay: null, repeatDays: null,
		endsType: null, endsAfterValue: null, endsAfterUnit: null, endsAfterVisits: null, endsOnDate: null,
		visitInstructions: null, emailTeamAboutAssignment: false,
		scheduleArn: null, scheduleName: null, scheduleStatus: "pending" as const,
	};

	const visits = await db
		.select({
			title: visitsSchema.title,
			instructions: visitsSchema.instructions,
			startDate: visitsSchema.startDate,
			endDate: visitsSchema.endDate,
			startTime: visitsSchema.startTime,
			endTime: visitsSchema.endTime,
			scheduleLater: visitsSchema.scheduleLater,
			anytime: visitsSchema.anytime,
			assignedTo: visitsSchema.assignedTo,
			emailOnAssign: visitsSchema.emailOnAssign,
			teamReminder: visitsSchema.teamReminder,
			status: visitsSchema.status,
		})
		.from(visitsSchema)
		.where(eq(visitsSchema.jobId, job.id));

	const [items, timeEntriesResult, expensesResult, notesResult, [clientRow], properties, invoicesResult, invoiceRemindersResult, profitability] = await Promise.all([
		getJobLineItemsByJobId(job.id),
		getTimeEntriesByJobId(job.id, { page: 1, limit: 10, search: "" }),
		getExpensesByJobId(job.id, { page: 1, limit: 10, search: "" }),
		getClientNotes(job.clientId, "jobs", { page: 1, limit: 20, search: "" }),
		db.select({
			title: clientsSchema.title,
			firstName: clientsSchema.firstName,
			lastName: clientsSchema.lastName,
			companyName: clientsSchema.companyName,
			useCompanyAsPrimary: clientsSchema.useCompanyAsPrimary,
			phones: clientsSchema.phones,
			emails: clientsSchema.emails,
		}).from(clientsSchema).where(eq(clientsSchema.id, job.clientId)),
		db.select({
			street1: propertiesSchema.street1,
			street2: propertiesSchema.street2,
			city: propertiesSchema.city,
			state: propertiesSchema.state,
			zip: propertiesSchema.zip,
		}).from(propertiesSchema).where(eq(propertiesSchema.clientId, job.clientId)).limit(1),
		getInvoicesByJobId(job.id, { page: 1, limit: 10, search: "" }),
		getInvoiceRemindersByJobId(job.id, { page: 1, limit: 10, search: "" }),
		getJobProfitability(job.id),
	]);

	const client = clientRow ?? null;
	const property = properties[0] ?? null;

	return { ...job, ...schedule, visits, lineItems: items, timeEntries: timeEntriesResult, expenses: expensesResult, clientNotes: notesResult, client, property, invoices: invoicesResult, invoiceReminders: invoiceRemindersResult, profitability };
}

export async function updateJobLineItems(jobId: string, data: UpdateJobLineItemsForm) {
	await db.delete(jobLineItemsSchema).where(eq(jobLineItemsSchema.jobId, jobId));

	if (data.lineItems.length > 0) {
		await db.insert(jobLineItemsSchema).values(
			data.lineItems.map((item, index) => ({
				jobId,
				name: item.name,
				description: item.description || null,
				qty: item.qty,
				unitCost: String(item.unitCost),
				unitPrice: String(item.unitPrice),
				imageFileId: item.imageFileId || null,
				sortOrder: index,
			})),
		);
	}

	return getJobById(jobId);
}

export async function updateJobStatus(jobId: string, status: "draft" | "active" | "action_required" | "complete" | "archived") {
	const [updated] = await db
		.update(jobsSchema)
		.set({ status })
		.where(eq(jobsSchema.id, jobId))
		.returning();
	return updated;
}

export async function deleteJob(jobId: string) {
	const [deleted] = await db
		.update(jobsSchema)
		.set({ deletedAt: new Date() })
		.where(eq(jobsSchema.id, jobId))
		.returning();
	return deleted;
}

export async function getJobStats() {
	const now = new Date();
	const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);

	const [result] = await db
		.select({
			endingWithin30: sql<number>`count(*) filter (where ${jobsSchema.jobType} = 'recurring' and ${jobsSchema.status} not in ('complete', 'archived') and ${jobSchedulesSchema.endsType} = 'on' and ${jobSchedulesSchema.endsOnDate} is not null and ${jobSchedulesSchema.endsOnDate}::date >= ${now.toISOString().slice(0, 10)} and ${jobSchedulesSchema.endsOnDate}::date <= ${new Date(now.getTime() + 30 * 86400000).toISOString().slice(0, 10)})`,
			lateCount: sql<number>`count(*) filter (where ${jobsSchema.status} not in ('complete', 'archived', 'active') and ${jobSchedulesSchema.startDate} is not null and ${jobSchedulesSchema.startDate}::date < ${now.toISOString().slice(0, 10)})`,
			requiresInvoicing: sql<number>`count(*) filter (where ${jobsSchema.status} = 'complete')`,
			actionRequired: sql<number>`count(*) filter (where ${jobsSchema.status} = 'action_required')`,
			unscheduled: sql<number>`count(*) filter (where ${jobSchedulesSchema.startDate} is null and ${jobsSchema.status} not in ('complete', 'archived'))`,
			recentVisitsCount: sql<number>`0`,
			recentVisitsRevenue: sql<number>`0`,
			scheduledVisitsCount: sql<number>`0`,
			scheduledVisitsRevenue: sql<number>`0`,
		})
		.from(jobsSchema)
		.leftJoin(jobSchedulesSchema, eq(jobsSchema.id, jobSchedulesSchema.jobId))
		.where(isNull(jobsSchema.deletedAt));

	return {
		endingWithin30: Number(result.endingWithin30),
		lateCount: Number(result.lateCount),
		requiresInvoicing: Number(result.requiresInvoicing),
		actionRequired: Number(result.actionRequired),
		unscheduled: Number(result.unscheduled),
		recentVisitsCount: Number(result.recentVisitsCount),
		recentVisitsRevenue: Number(result.recentVisitsRevenue),
		scheduledVisitsCount: Number(result.scheduledVisitsCount),
		scheduledVisitsRevenue: Number(result.scheduledVisitsRevenue),
	};
}
