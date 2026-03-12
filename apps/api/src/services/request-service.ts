import db, { requestsSchema, requestFilesSchema, requestLineItemsSchema } from "@repo/db";
import type { CreateRequestForm } from "@repo/zod/request";
import { and, eq, isNull } from "drizzle-orm";

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

	return { ...request, fileIds: fileIds ?? [], lineItems: insertedLineItems };
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
			return { ...request, fileIds: files.map((f) => f.fileId), lineItems: items };
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

	const files = await db
		.select({ fileId: requestFilesSchema.fileId })
		.from(requestFilesSchema)
		.where(eq(requestFilesSchema.requestId, request.id));

	const items = await db
		.select()
		.from(requestLineItemsSchema)
		.where(eq(requestLineItemsSchema.requestId, request.id));

	return { ...request, fileIds: files.map((f) => f.fileId), lineItems: items };
}
