import db, { requestsSchema, requestFilesSchema, requestLineItemsSchema, requestAssessmentsSchema, clientsSchema, filesSchema } from "@repo/db";
import type { CreateRequestForm, UpdateRequestOverviewForm, UpdateRequestLineItemsForm, UpdateRequestAssessmentForm } from "@repo/zod/request";
import { and, eq, isNull } from "drizzle-orm";
import { signKey } from "./file-service";
import { createReminderSchedule, deleteReminderSchedule } from "../lib/scheduler";

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
			const schedule = await createReminderSchedule(request.id, assessment.startDate ?? null, assessment.startTime ?? null, assessment.teamReminder);
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

export async function getRequests() {
	const requests = await db
		.select()
		.from(requestsSchema)
		.where(isNull(requestsSchema.deletedAt));

	const result = await Promise.all(
		requests.map(async (request) => {
			const [assessment] = await db
				.select()
				.from(requestAssessmentsSchema)
				.where(eq(requestAssessmentsSchema.requestId, request.id));

			const items = await db
				.select()
				.from(requestLineItemsSchema)
				.where(eq(requestLineItemsSchema.requestId, request.id));

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
				attachments: [],
				client: null,
				lineItems: items.map((item) => ({
					id: item.id,
					name: item.name,
					description: item.description,
					qty: item.qty,
					unitPrice: item.unitPrice,
					image: null,
					createdAt: item.createdAt,
				})),
			};
		}),
	);

	return result;
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

	const [[assessment], attachments, items, [client]] = await Promise.all([
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
		const schedule = await createReminderSchedule(requestId, data.startDate ?? null, data.startTime ?? null, data.teamReminder);
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
