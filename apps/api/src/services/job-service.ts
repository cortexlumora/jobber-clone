import db, { jobsSchema, jobLineItemsSchema, filesSchema, visitsSchema, clientsSchema, propertiesSchema } from "@repo/db";
import type { CreateJobForm, UpdateJobLineItemsForm } from "@repo/zod/job";
import type { PaginationQuery } from "@repo/zod/pagination";
import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { signKey } from "./file-service";
import { getTimeEntriesByJobId } from "./time-entry-service";
import { getExpensesByJobId } from "./expense-service";
import { getClientNotes } from "./client-note-service";

export async function createJob(userId: string, data: CreateJobForm) {
	const { lineItems, ...jobData } = data;

	const [job] = await db
		.insert(jobsSchema)
		.values({
			userId,
			clientId: jobData.clientId,
			title: jobData.title,
			jobNumber: jobData.jobNumber || null,
			salesperson: jobData.salesperson || null,
			jobType: jobData.jobType ?? "one_off",
			startDate: jobData.startDate || null,
			startTime: jobData.startTime || null,
			endTime: jobData.endTime || null,
			repeats: jobData.repeats || null,
			repeatDays: jobData.repeatDays ?? null,
			endsType: jobData.endsType ?? null,
			endsAfterVisits: jobData.endsAfterVisits ?? null,
			endsOnDate: jobData.endsOnDate || null,
			visitInstructions: jobData.visitInstructions || null,
			assignedUserIds: jobData.assignedUserIds ?? null,
			billingType: jobData.billingType ?? null,
			invoiceFrequency: jobData.invoiceFrequency || null,
			autoPay: jobData.autoPay ?? false,
			relatedQuoteId: jobData.relatedQuoteId || null,
			relatedRequestId: jobData.relatedRequestId || null,
		})
		.returning();

	let insertedLineItems: (typeof jobLineItemsSchema.$inferSelect)[] = [];
	if (lineItems && lineItems.length > 0) {
		insertedLineItems = await db
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
			)
			.returning();
	}

	return { ...job, lineItems: insertedLineItems.map((item) => ({ ...item, image: null })), visits: [], timeEntries: { data: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } }, expenses: { data: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } }, clientNotes: { data: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } }, client: null, property: null };
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
				startDate: jobsSchema.startDate,
				startTime: jobsSchema.startTime,
				endTime: jobsSchema.endTime,
				repeats: jobsSchema.repeats,
				repeatDays: jobsSchema.repeatDays,
				endsType: jobsSchema.endsType,
				endsOnDate: jobsSchema.endsOnDate,
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
			.where(where)
			.orderBy(desc(jobsSchema.createdAt))
			.limit(limit)
			.offset(offset),
		db.select({ count: sql<number>`count(*)` }).from(jobsSchema).where(where),
	]);

	const data = await Promise.all(
		rows.map(async (row) => {
			const [property] = await db
				.select({ street1: propertiesSchema.street1, street2: propertiesSchema.street2, city: propertiesSchema.city, state: propertiesSchema.state, zip: propertiesSchema.zip })
				.from(propertiesSchema)
				.where(eq(propertiesSchema.clientId, row.clientId))
				.limit(1);

			const lineItems = await db.select({ qty: jobLineItemsSchema.qty, unitPrice: jobLineItemsSchema.unitPrice }).from(jobLineItemsSchema).where(eq(jobLineItemsSchema.jobId, row.id));
			const total = lineItems.reduce((sum, item) => sum + item.qty * Number(item.unitPrice), 0);

			return { ...row, client: row.client?.firstName ? row.client : null, property: property ?? null, total };
		}),
	);

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

export async function getJobById(jobId: string) {
	const [job] = await db
		.select()
		.from(jobsSchema)
		.where(and(eq(jobsSchema.id, jobId), isNull(jobsSchema.deletedAt)));

	if (!job) return null;

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

	const [items, timeEntriesResult, expensesResult, notesResult, [clientRow], properties] = await Promise.all([
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
	]);

	const client = clientRow ?? null;
	const property = properties[0] ?? null;

	return { ...job, visits, lineItems: items, timeEntries: timeEntriesResult, expenses: expensesResult, clientNotes: notesResult, client, property };
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

export async function getJobStats() {
	const now = new Date();
	const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);

	const [result] = await db
		.select({
			endingWithin30: sql<number>`count(*) filter (where ${jobsSchema.jobType} = 'recurring' and ${jobsSchema.status} not in ('complete', 'archived') and ${jobsSchema.endsType} = 'on' and ${jobsSchema.endsOnDate} is not null and ${jobsSchema.endsOnDate}::date >= ${now.toISOString().slice(0, 10)} and ${jobsSchema.endsOnDate}::date <= ${new Date(now.getTime() + 30 * 86400000).toISOString().slice(0, 10)})`,
			lateCount: sql<number>`count(*) filter (where ${jobsSchema.status} not in ('complete', 'archived', 'active') and ${jobsSchema.startDate} is not null and ${jobsSchema.startDate}::date < ${now.toISOString().slice(0, 10)})`,
			requiresInvoicing: sql<number>`count(*) filter (where ${jobsSchema.status} = 'complete')`,
			actionRequired: sql<number>`count(*) filter (where ${jobsSchema.status} = 'action_required')`,
			unscheduled: sql<number>`count(*) filter (where ${jobsSchema.startDate} is null and ${jobsSchema.status} not in ('complete', 'archived'))`,
			recentVisitsCount: sql<number>`0`,
			recentVisitsRevenue: sql<number>`0`,
			scheduledVisitsCount: sql<number>`0`,
			scheduledVisitsRevenue: sql<number>`0`,
		})
		.from(jobsSchema)
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
