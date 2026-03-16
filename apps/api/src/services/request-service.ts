import db, { requestsSchema, requestFilesSchema, requestLineItemsSchema, requestAssessmentsSchema, clientsSchema, propertiesSchema, filesSchema } from "@repo/db";
import type { CreateRequestForm, UpdateRequestOverviewForm, UpdateRequestLineItemsForm, UpdateRequestAssessmentForm } from "@repo/zod/request";
import type { PaginationQuery } from "@repo/zod/pagination";
import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { signKey } from "./file-service";
import { createReminderSchedule, deleteReminderSchedule } from "../lib/scheduler";
import { getClientNotes } from "./client-note-service";

export async function createRequest(userId: string, data: CreateRequestForm) {
	const { fileIds, lineItems, assessment, ...requestData } = data;

	const [request] = await db
		.insert(requestsSchema)
		.values({
			userId,
			clientId: requestData.clientId,
			title: requestData.title,
			serviceDescription: requestData.serviceDescription,
		})
		.returning();

	// Create assessment if provided
	if (assessment) {
		const [assessmentRow] = await db
			.insert(requestAssessmentsSchema)
			.values({
				requestId: request.id,
				instructions: assessment.instructions || null,
				startDate: assessment.startDate || null,
				endDate: assessment.endDate || null,
				startTime: assessment.startTime || null,
				endTime: assessment.endTime || null,
				scheduleLater: assessment.scheduleLater ?? false,
				anytime: assessment.anytime ?? false,
				teamReminder: assessment.teamReminder ?? "none",
			})
			.returning();

		// Schedule reminder
		if (assessment.teamReminder && assessment.teamReminder !== "none") {
			const schedule = await createReminderSchedule({ type: "assessment_reminder", entityId: request.id, startDate: assessment.startDate ?? null, startTime: assessment.startTime ?? null, teamReminder: assessment.teamReminder });
			if (schedule) {
				await db.update(requestAssessmentsSchema).set({
					reminderScheduleName: schedule.scheduleName,
					reminderScheduledAt: schedule.scheduledAt,
				}).where(eq(requestAssessmentsSchema.id, assessmentRow.id));
			}
		}
	}

	if (fileIds && fileIds.length > 0) {
		await db.insert(requestFilesSchema).values(
			fileIds.map((fileId) => ({ requestId: request.id, fileId })),
		);
	}

	if (lineItems && lineItems.length > 0) {
		await db.insert(requestLineItemsSchema).values(
			lineItems.map((item) => ({
				requestId: request.id,
				name: item.name,
				description: item.description || null,
				qty: item.qty,
				unitPrice: String(item.unitPrice),
				imageFileId: item.imageFileId || null,
			})),
		);
	}

	return { id: request.id };
}

export async function getRequests(pagination: PaginationQuery) {
	const { page, limit } = pagination;
	const offset = (page - 1) * limit;

	const where = isNull(requestsSchema.deletedAt);

	const [rows, [{ count }]] = await Promise.all([
		db
			.select({
				id: requestsSchema.id,
				clientId: requestsSchema.clientId,
				title: requestsSchema.title,
				status: requestsSchema.status,
				createdAt: requestsSchema.createdAt,
				client: {
					title: clientsSchema.title,
					firstName: clientsSchema.firstName,
					lastName: clientsSchema.lastName,
					companyName: clientsSchema.companyName,
					useCompanyAsPrimary: clientsSchema.useCompanyAsPrimary,
					phones: clientsSchema.phones,
					emails: clientsSchema.emails,
				},
			})
			.from(requestsSchema)
			.innerJoin(clientsSchema, eq(requestsSchema.clientId, clientsSchema.id))
			.where(where)
			.orderBy(desc(requestsSchema.createdAt))
			.limit(limit)
			.offset(offset),
		db.select({ count: sql<number>`count(*)` }).from(requestsSchema).where(where),
	]);

	const clientIds = [...new Set(rows.map((r) => r.clientId))];
	const properties = clientIds.length > 0
		? await db
				.selectDistinctOn([propertiesSchema.clientId], {
					clientId: propertiesSchema.clientId,
					street1: propertiesSchema.street1,
					street2: propertiesSchema.street2,
					city: propertiesSchema.city,
					state: propertiesSchema.state,
					zip: propertiesSchema.zip,
				})
				.from(propertiesSchema)
				.where(sql`${propertiesSchema.clientId} in ${clientIds}`)
		: [];

	const propertyMap = new Map(properties.map((p) => [p.clientId, p]));

	const data = rows.map((row) => ({
		...row,
		client: row.client?.firstName ? row.client : null,
		property: propertyMap.get(row.clientId) ?? null,
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

async function getRequestAttachmentsByReqId(requestId: string) {
	const files = await db
		.select({
			id: filesSchema.id,
			name: filesSchema.name,
			contentType: filesSchema.contentType,
			key: filesSchema.key,
		})
		.from(requestFilesSchema)
		.leftJoin(filesSchema, eq(requestFilesSchema.fileId, filesSchema.id))
		.where(eq(requestFilesSchema.requestId, requestId));

	return Promise.all(
		files
			.filter((f) => f.key)
			.map(async (file) => ({
				id: file.id!,
				name: file.name!,
				contentType: file.contentType!,
				url: await signKey(file.key!),
			})),
	);
}

async function getRequestLineItemsByReqId(requestId: string) {
	const items = await db
		.select({
			id: requestLineItemsSchema.id,
			name: requestLineItemsSchema.name,
			description: requestLineItemsSchema.description,
			qty: requestLineItemsSchema.qty,
			unitPrice: requestLineItemsSchema.unitPrice,
			createdAt: requestLineItemsSchema.createdAt,
			image: {
				id: filesSchema.id,
				name: filesSchema.name,
				contentType: filesSchema.contentType,
				key: filesSchema.key,
			},
		})
		.from(requestLineItemsSchema)
		.leftJoin(filesSchema, eq(requestLineItemsSchema.imageFileId, filesSchema.id))
		.where(eq(requestLineItemsSchema.requestId, requestId));

	return Promise.all(
		items.map(async (item) => ({
			...item,
			image: item.image?.key
				? { id: item.image.id!, name: item.image.name!, contentType: item.image.contentType!, url: await signKey(item.image.key) }
				: null,
		})),
	);
}

export async function getRequestById(requestId: string) {
	const [request] = await db
		.select()
		.from(requestsSchema)
		.where(and(eq(requestsSchema.id, requestId), isNull(requestsSchema.deletedAt)));

	if (!request) return null;

	const [[assessment], attachments, items, [client], notesResult] = await Promise.all([
		db.select().from(requestAssessmentsSchema).where(eq(requestAssessmentsSchema.requestId, request.id)),
		getRequestAttachmentsByReqId(request.id),
		getRequestLineItemsByReqId(request.id),
		db
			.select({
				id: clientsSchema.id,
				title: clientsSchema.title,
				firstName: clientsSchema.firstName,
				lastName: clientsSchema.lastName,
				companyName: clientsSchema.companyName,
				useCompanyAsPrimary: clientsSchema.useCompanyAsPrimary,
				phones: clientsSchema.phones,
				emails: clientsSchema.emails,
				leadSource: clientsSchema.leadSource,
			})
			.from(clientsSchema)
			.where(eq(clientsSchema.id, request.clientId)),
		getClientNotes(request.clientId, "requests", { page: 1, limit: 20, search: "" }),
	]);

	return {
		id: request.id,
		clientId: request.clientId,
		title: request.title,
		serviceDescription: request.serviceDescription,
		status: request.status,
		createdAt: request.createdAt,
		assessment: assessment ? {
			instructions: assessment.instructions,
			startDate: assessment.startDate,
			endDate: assessment.endDate,
			startTime: assessment.startTime,
			endTime: assessment.endTime,
			scheduleLater: assessment.scheduleLater,
			anytime: assessment.anytime,
			teamReminder: assessment.teamReminder,
		} : null,
		attachments,
		lineItems: items,
		client,
		clientNotes: notesResult,
	};
}

export async function updateRequestOverview(requestId: string, data: UpdateRequestOverviewForm) {
	const [updated] = await db
		.update(requestsSchema)
		.set({ serviceDescription: data.serviceDescription })
		.where(eq(requestsSchema.id, requestId))
		.returning();

	if (!updated) return null;

	await db.delete(requestFilesSchema).where(eq(requestFilesSchema.requestId, requestId));
	if (data.fileIds && data.fileIds.length > 0) {
		await db.insert(requestFilesSchema).values(data.fileIds.map((fileId) => ({ requestId, fileId })));
	}

	return getRequestById(requestId);
}

export async function updateRequestLineItems(requestId: string, data: UpdateRequestLineItemsForm) {
	await db.delete(requestLineItemsSchema).where(eq(requestLineItemsSchema.requestId, requestId));

	if (data.lineItems.length > 0) {
		await db.insert(requestLineItemsSchema).values(
			data.lineItems.map((item) => ({
				requestId,
				name: item.name,
				description: item.description || null,
				qty: item.qty,
				unitPrice: String(item.unitPrice),
				imageFileId: item.imageFileId || null,
			})),
		);
	}

	return getRequestById(requestId);
}

export async function updateRequestAssessment(requestId: string, data: UpdateRequestAssessmentForm) {
	// Get existing assessment
	const [existing] = await db
		.select()
		.from(requestAssessmentsSchema)
		.where(eq(requestAssessmentsSchema.requestId, requestId));

	// Delete old schedule if exists
	if (existing?.reminderScheduleName) {
		await deleteReminderSchedule(existing.reminderScheduleName);
	}

	const assessmentValues = {
		instructions: data.instructions || null,
		startDate: data.startDate || null,
		endDate: data.endDate || null,
		startTime: data.startTime || null,
		endTime: data.endTime || null,
		scheduleLater: data.scheduleLater ?? false,
		anytime: data.anytime ?? false,
		teamReminder: data.teamReminder ?? "none" as const,
		reminderScheduleName: null as string | null,
		reminderScheduledAt: null as Date | null,
		reminderProcessedAt: null as Date | null,
	};

	// Create new schedule if needed
	if (data.teamReminder && data.teamReminder !== "none") {
		const schedule = await createReminderSchedule({ type: "assessment_reminder", entityId: requestId, startDate: data.startDate ?? null, startTime: data.startTime ?? null, teamReminder: data.teamReminder });
		if (schedule) {
			assessmentValues.reminderScheduleName = schedule.scheduleName;
			assessmentValues.reminderScheduledAt = schedule.scheduledAt;
		}
	}

	if (existing) {
		await db.update(requestAssessmentsSchema).set(assessmentValues).where(eq(requestAssessmentsSchema.id, existing.id));
	} else {
		await db.insert(requestAssessmentsSchema).values({ requestId, ...assessmentValues });
	}

	return getRequestById(requestId);
}

export async function getRequestStats() {
	const now = new Date();
	const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);
	const sixtyDaysAgo = new Date(now.getTime() - 60 * 86400000);

	const today = now.toISOString().slice(0, 10);

	const [result] = await db
		.select({
			newCount: sql<number>`count(*) filter (where ${requestsSchema.status} = 'new')`,
			assessedCount: sql<number>`count(*) filter (where ${requestsSchema.status} = 'assessed')`,
			overdueCount: sql<number>`count(*) filter (where ${requestsSchema.status} in ('new', 'assessed') and ${requestAssessmentsSchema.startDate} is not null and ${requestAssessmentsSchema.startDate} < ${today})`,
			unscheduledCount: sql<number>`count(*) filter (where ${requestsSchema.status} in ('new', 'assessed') and (${requestAssessmentsSchema.id} is null or ${requestAssessmentsSchema.scheduleLater} = true))`,
			newLast30: sql<number>`count(*) filter (where ${requestsSchema.createdAt} >= ${thirtyDaysAgo})`,
			newPrev30: sql<number>`count(*) filter (where ${requestsSchema.createdAt} >= ${sixtyDaysAgo} and ${requestsSchema.createdAt} < ${thirtyDaysAgo})`,
			convertedLast30: sql<number>`count(*) filter (where ${requestsSchema.status} = 'converted' and ${requestsSchema.createdAt} >= ${thirtyDaysAgo})`,
			totalLast30: sql<number>`count(*) filter (where ${requestsSchema.createdAt} >= ${thirtyDaysAgo})`,
		})
		.from(requestsSchema)
		.leftJoin(requestAssessmentsSchema, eq(requestsSchema.id, requestAssessmentsSchema.requestId))
		.where(isNull(requestsSchema.deletedAt));

	const calcChange = (current: number, previous: number) => {
		if (previous === 0) return current > 0 ? 100 : 0;
		return Math.round(((current - previous) / previous) * 100);
	};

	const totalLast30 = Number(result.totalLast30);
	const convertedLast30 = Number(result.convertedLast30);

	return {
		newCount: Number(result.newCount),
		assessedCount: Number(result.assessedCount),
		overdueCount: Number(result.overdueCount),
		unscheduledCount: Number(result.unscheduledCount),
		newLast30: Number(result.newLast30),
		newLast30Change: calcChange(Number(result.newLast30), Number(result.newPrev30)),
		conversionRate: totalLast30 > 0 ? Math.round((convertedLast30 / totalLast30) * 100) : 0,
	};
}
