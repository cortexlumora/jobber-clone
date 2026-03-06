import db, { requestsSchema, requestFilesSchema } from "@repo/db";
import type { CreateRequestForm } from "@repo/zod/request";
import { and, eq, isNull } from "drizzle-orm";

export async function createRequest(userId: string, data: CreateRequestForm) {
	const { fileIds, ...requestData } = data;

	const [request] = await db
		.insert(requestsSchema)
		.values({
			userId,
			clientId: requestData.clientId,
			serviceDescription: requestData.serviceDescription,
			bestDay: requestData.bestDay,
			alternateDay: requestData.alternateDay || null,
			preferredArrival: requestData.preferredArrival,
			assessmentRequired: requestData.assessmentRequired,
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

	return { ...request, fileIds: fileIds ?? [] };
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
			return { ...request, fileIds: files.map((f) => f.fileId) };
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

	return { ...request, fileIds: files.map((f) => f.fileId) };
}
