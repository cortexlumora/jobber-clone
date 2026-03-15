import db, { requestsSchema, requestFilesSchema, requestLineItemsSchema, clientsSchema, filesSchema } from "@repo/db";
import type { CreateRequestForm, UpdateRequestOverviewForm, UpdateRequestLineItemsForm, UpdateRequestAssessmentForm } from "@repo/zod/request";
import { and, eq, isNull } from "drizzle-orm";
import { signKey } from "./file-service";
import { createReminderSchedule, deleteReminderSchedule } from "../lib/scheduler";

// Flatten assessment from grouped form to DB columns
function flattenAssessment(assessment?: CreateRequestForm["assessment"]) {
	return {
		assessmentInstructions: assessment?.instructions || null,
		assessmentStartDate: assessment?.startDate || null,
		assessmentEndDate: assessment?.endDate || null,
		assessmentStartTime: assessment?.startTime || null,
		assessmentEndTime: assessment?.endTime || null,
		scheduleLater: assessment?.scheduleLater ?? false,
		anytime: assessment?.anytime ?? false,
		teamReminder: assessment?.teamReminder ?? ("none" as const),
	};
}

// Nest assessment from DB columns to grouped response, and strip flat fields
function toRequestResponse(row: typeof requestsSchema.$inferSelect) {
	const {
		assessmentInstructions,
		assessmentStartDate,
		assessmentEndDate,
		assessmentStartTime,
		assessmentEndTime,
		scheduleLater,
		anytime,
		teamReminder,
		reminderScheduleName: _reminderScheduleName,
		reminderScheduledAt: _reminderScheduledAt,
		reminderProcessedAt: _reminderProcessedAt,
		updatedAt: _updatedAt,
		deletedAt: _deletedAt,
		userId: _userId,
		...rest
	} = row;
	return {
		...rest,
		assessment: {
			instructions: assessmentInstructions,
			startDate: assessmentStartDate,
			endDate: assessmentEndDate,
			startTime: assessmentStartTime,
			endTime: assessmentEndTime,
			scheduleLater,
			anytime,
			teamReminder,
		},
	};
}

export async function createRequest(userId: string, data: CreateRequestForm) {
	const { fileIds, lineItems, assessment, ...requestData } = data;

	const [request] = await db
		.insert(requestsSchema)
		.values({
			userId,
			clientId: requestData.clientId,
			title: requestData.title,
			serviceDescription: requestData.serviceDescription,
			...flattenAssessment(assessment),
		})
		.returning();

	if (fileIds && fileIds.length > 0) {
		await db.insert(requestFilesSchema).values(
			fileIds.map((fileId) => ({
				requestId: request.id,
				fileId,
			})),
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

	// Schedule reminder if assessment has one
	if (assessment?.teamReminder && assessment.teamReminder !== "none") {
		const schedule = await createReminderSchedule(request.id, assessment.startDate ?? null, assessment.startTime ?? null, assessment.teamReminder);
		if (schedule) {
			await db.update(requestsSchema).set({
				reminderScheduleName: schedule.scheduleName,
				reminderScheduledAt: schedule.scheduledAt,
				reminderProcessedAt: null,
			}).where(eq(requestsSchema.id, request.id));
		}
	}

	return { id: request.id };
}

export async function getRequestsByUser(userId: string) {
	const requests = await db
		.select()
		.from(requestsSchema)
		.where(and(eq(requestsSchema.userId, userId), isNull(requestsSchema.deletedAt)));

	const result = await Promise.all(
		requests.map(async (request) => {
			const items = await db.select().from(requestLineItemsSchema).where(eq(requestLineItemsSchema.requestId, request.id));
			return {
				...toRequestResponse(request),
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
			image: item.image ? {
				...item.image,
				url: item.image.key ? await signKey(item.image.key) : null,
				key: undefined,
			} : null
		})),
	);
}

export async function getRequestById(requestId: string) {
	const [request] = await db
		.select()
		.from(requestsSchema)
		.where(and(eq(requestsSchema.id, requestId), isNull(requestsSchema.deletedAt)));

	if (!request) return null;

	const [attachments, items, [client]] = await Promise.all([
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
		status: request.status,
		createdAt: request.createdAt,
		title: request.title,
		clientId: request.clientId,
		serviceDescription: request.serviceDescription,
		assessment: {
			instructions: request.assessmentInstructions,
			startDate: request.assessmentStartDate,
			endDate: request.assessmentEndDate,
			startTime: request.assessmentStartTime,
			endTime: request.assessmentEndTime,
			scheduleLater: request.scheduleLater,
			anytime: request.anytime,
			teamReminder: request.teamReminder,
		},
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

	// Replace file associations
	await db.delete(requestFilesSchema).where(eq(requestFilesSchema.requestId, requestId));
	if (data.fileIds && data.fileIds.length > 0) {
		await db.insert(requestFilesSchema).values(data.fileIds.map((fileId) => ({ requestId, fileId })));
	}

	return getRequestById(requestId);
}

export async function updateRequestLineItems(requestId: string, data: UpdateRequestLineItemsForm) {
	// Delete existing line items and replace
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
	// Get existing schedule name to delete if needed
	const [existing] = await db
		.select({ reminderScheduleName: requestsSchema.reminderScheduleName })
		.from(requestsSchema)
		.where(eq(requestsSchema.id, requestId));

	await db
		.update(requestsSchema)
		.set({
			assessmentInstructions: data.instructions || null,
			assessmentStartDate: data.startDate || null,
			assessmentEndDate: data.endDate || null,
			assessmentStartTime: data.startTime || null,
			assessmentEndTime: data.endTime || null,
			scheduleLater: data.scheduleLater ?? false,
			anytime: data.anytime ?? false,
			teamReminder: data.teamReminder ?? "none",
		})
		.where(eq(requestsSchema.id, requestId));

	// Delete old schedule if exists
	if (existing?.reminderScheduleName) {
		await deleteReminderSchedule(existing.reminderScheduleName);
	}

	// Create new schedule or clear
	if (data.teamReminder && data.teamReminder !== "none") {
		const schedule = await createReminderSchedule(requestId, data.startDate ?? null, data.startTime ?? null, data.teamReminder);
		await db.update(requestsSchema).set({
			reminderScheduleName: schedule?.scheduleName ?? null,
			reminderScheduledAt: schedule?.scheduledAt ?? null,
			reminderProcessedAt: null,
		}).where(eq(requestsSchema.id, requestId));
	} else {
		await db.update(requestsSchema).set({
			reminderScheduleName: null,
			reminderScheduledAt: null,
			reminderProcessedAt: null,
		}).where(eq(requestsSchema.id, requestId));
	}

	return getRequestById(requestId);
}
