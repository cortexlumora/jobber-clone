import db, { requestsSchema, requestFilesSchema, requestLineItemsSchema, clientsSchema, propertiesSchema } from "@repo/db";
import type { CreateRequestForm, UpdateRequestOverviewForm, UpdateRequestLineItemsForm, UpdateRequestAssessmentForm } from "@repo/zod/request";
import { and, eq, isNull } from "drizzle-orm";
import { getSignedFiles } from "./file-service";

export async function createRequest(userId: string, data: CreateRequestForm) {
	const { fileIds, lineItems, ...requestData } = data;

	const [request] = await db
		.insert(requestsSchema)
		.values({
			userId,
			clientId: requestData.clientId,
			title: requestData.title,
			serviceDescription: requestData.serviceDescription,
			assessmentInstructions: requestData.assessmentInstructions || null,
			assessmentStartDate: requestData.assessmentStartDate || null,
			assessmentEndDate: requestData.assessmentEndDate || null,
			assessmentStartTime: requestData.assessmentStartTime || null,
			assessmentEndTime: requestData.assessmentEndTime || null,
			scheduleLater: requestData.scheduleLater ?? false,
			anytime: requestData.anytime ?? false,
			teamReminder: requestData.teamReminder ?? "none",
			internalNotes: requestData.internalNotes || null,
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

	let insertedLineItems: typeof requestLineItemsSchema.$inferSelect[] = [];
	if (lineItems && lineItems.length > 0) {
		insertedLineItems = await db.insert(requestLineItemsSchema).values(
			lineItems.map((item) => ({
				requestId: request.id,
				name: item.name,
				description: item.description || null,
				qty: item.qty,
				unitPrice: String(item.unitPrice),
				imageFileId: item.imageFileId || null,
			})),
		).returning();
	}

	return { ...request, fileIds: fileIds ?? [], files: [], client: null, lineItems: insertedLineItems };
}

export async function getRequestsByUser(userId: string) {
	const requests = await db
		.select()
		.from(requestsSchema)
		.where(and(eq(requestsSchema.userId, userId), isNull(requestsSchema.deletedAt)));

	const result = await Promise.all(
		requests.map(async (request) => {
			const files = await db
				.select({ fileId: requestFilesSchema.fileId })
				.from(requestFilesSchema)
				.where(eq(requestFilesSchema.requestId, request.id));
			const items = await db
				.select()
				.from(requestLineItemsSchema)
				.where(eq(requestLineItemsSchema.requestId, request.id));
			return { ...request, fileIds: files.map((f) => f.fileId), files: [], client: null, lineItems: items };
		}),
	);

	return result;
}

export async function getRequestById(requestId: string) {
	const [request] = await db
		.select()
		.from(requestsSchema)
		.where(and(eq(requestsSchema.id, requestId), isNull(requestsSchema.deletedAt)));

	if (!request) return null;

	const [fileRows, items, [client], properties] = await Promise.all([
		db.select({ fileId: requestFilesSchema.fileId })
			.from(requestFilesSchema)
			.where(eq(requestFilesSchema.requestId, request.id)),
		db.select()
			.from(requestLineItemsSchema)
			.where(eq(requestLineItemsSchema.requestId, request.id)),
		db.select()
			.from(clientsSchema)
			.where(eq(clientsSchema.id, request.clientId)),
		db.select()
			.from(propertiesSchema)
			.where(eq(propertiesSchema.clientId, request.clientId))
			.limit(1),
	]);

	const fileIds = fileRows.map((f) => f.fileId);
	const signedFiles = await getSignedFiles(fileIds);

	return {
		...request,
		fileIds,
		files: signedFiles,
		lineItems: items,
		client: client ? {
			id: client.id,
			title: client.title,
			firstName: client.firstName,
			lastName: client.lastName,
			companyName: client.companyName,
			useCompanyAsPrimary: client.useCompanyAsPrimary,
			phones: client.phones,
			emails: client.emails,
			leadSource: client.leadSource,
			property: properties[0] ?? null,
		} : null,
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
		await db.insert(requestFilesSchema).values(
			data.fileIds.map((fileId) => ({ requestId, fileId })),
		);
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
	await db
		.update(requestsSchema)
		.set({
			assessmentInstructions: data.assessmentInstructions || null,
			assessmentStartDate: data.assessmentStartDate || null,
			assessmentEndDate: data.assessmentEndDate || null,
			assessmentStartTime: data.assessmentStartTime || null,
			assessmentEndTime: data.assessmentEndTime || null,
			scheduleLater: data.scheduleLater ?? false,
			anytime: data.anytime ?? false,
			teamReminder: data.teamReminder ?? "none",
		})
		.where(eq(requestsSchema.id, requestId));

	return getRequestById(requestId);
}
