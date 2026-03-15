import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import db, { clientNotesSchema, clientNoteFilesSchema, filesSchema, usersSchema } from "@repo/db";
import type { CreateClientNoteForm, UpdateClientNoteForm } from "@repo/zod/client-note";
import type { PaginationQuery } from "@repo/zod/pagination";
import type { ClientNoteFileDTO } from "@repo/dto";
import { eq, desc, asc, isNull, and, sql } from "drizzle-orm";
import { s3, S3_BUCKET } from "../lib/s3";

async function getPresignedFiles(noteId: string): Promise<ClientNoteFileDTO[]> {
	const rows = await db
		.select({
			id: filesSchema.id,
			name: filesSchema.name,
			contentType: filesSchema.contentType,
			key: filesSchema.key,
		})
		.from(clientNoteFilesSchema)
		.innerJoin(filesSchema, eq(clientNoteFilesSchema.fileId, filesSchema.id))
		.where(eq(clientNoteFilesSchema.noteId, noteId));

	return Promise.all(
		rows.map(async (file) => {
			const command = new GetObjectCommand({ Bucket: S3_BUCKET, Key: file.key });
			const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
			return { id: file.id, name: file.name, contentType: file.contentType, url };
		}),
	);
}

export async function createClientNote(userId: string, clientId: string, data: CreateClientNoteForm) {
	const [note] = await db
		.insert(clientNotesSchema)
		.values({
			clientId,
			createdById: userId,
			content: data.content,
			relatedToRequests: data.relatedToRequests ?? false,
			relatedToQuotes: data.relatedToQuotes ?? false,
			relatedToJobs: data.relatedToJobs ?? false,
			relatedToInvoices: data.relatedToInvoices ?? false,
		})
		.returning();

	if (data.fileIds && data.fileIds.length > 0) {
		await db.insert(clientNoteFilesSchema).values(
			data.fileIds.map((fileId) => ({
				noteId: note.id,
				fileId,
			})),
		);
	}

	const [user] = await db
		.select({ name: usersSchema.name })
		.from(usersSchema)
		.where(eq(usersSchema.id, userId));

	const files = await getPresignedFiles(note.id);

	return {
		...note,
		createdByName: user?.name ?? "",
		createdByAvatar: null,
		files,
	};
}

export type RelatedToFilter = "all" | "requests" | "quotes" | "jobs" | "invoices";

export async function getClientNotes(clientId: string, relatedTo?: RelatedToFilter, pagination?: PaginationQuery) {
	const { page = 1, limit = 20 } = pagination ?? {};
	const offset = (page - 1) * limit;

	const conditions = [eq(clientNotesSchema.clientId, clientId), isNull(clientNotesSchema.deletedAt)];

	if (relatedTo === "requests") conditions.push(eq(clientNotesSchema.relatedToRequests, true));
	if (relatedTo === "quotes") conditions.push(eq(clientNotesSchema.relatedToQuotes, true));
	if (relatedTo === "jobs") conditions.push(eq(clientNotesSchema.relatedToJobs, true));
	if (relatedTo === "invoices") conditions.push(eq(clientNotesSchema.relatedToInvoices, true));

	const where = and(...conditions);

	const [notes, [{ count }]] = await Promise.all([
		db
			.select({
				id: clientNotesSchema.id,
				clientId: clientNotesSchema.clientId,
				createdById: clientNotesSchema.createdById,
				createdByName: usersSchema.name,
				content: clientNotesSchema.content,
				isPinned: clientNotesSchema.isPinned,
				relatedToRequests: clientNotesSchema.relatedToRequests,
				relatedToQuotes: clientNotesSchema.relatedToQuotes,
				relatedToJobs: clientNotesSchema.relatedToJobs,
				relatedToInvoices: clientNotesSchema.relatedToInvoices,
				createdAt: clientNotesSchema.createdAt,
				updatedAt: clientNotesSchema.updatedAt,
			})
			.from(clientNotesSchema)
			.innerJoin(usersSchema, eq(clientNotesSchema.createdById, usersSchema.id))
			.where(where)
			.orderBy(desc(clientNotesSchema.isPinned), desc(clientNotesSchema.createdAt))
			.limit(limit)
			.offset(offset),
		db.select({ count: sql<number>`count(*)` }).from(clientNotesSchema).where(where),
	]);

	const data = await Promise.all(
		notes.map(async (note) => {
			const files = await getPresignedFiles(note.id);
			return { ...note, createdByAvatar: null as string | null, files };
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

export async function updateClientNote(noteId: string, data: UpdateClientNoteForm) {
	const [note] = await db
		.update(clientNotesSchema)
		.set({
			content: data.content,
			relatedToRequests: data.relatedToRequests ?? false,
			relatedToQuotes: data.relatedToQuotes ?? false,
			relatedToJobs: data.relatedToJobs ?? false,
			relatedToInvoices: data.relatedToInvoices ?? false,
		})
		.where(eq(clientNotesSchema.id, noteId))
		.returning();

	if (!note) return null;

	// Replace file associations: delete old, insert new
	await db.delete(clientNoteFilesSchema).where(eq(clientNoteFilesSchema.noteId, noteId));
	if (data.fileIds && data.fileIds.length > 0) {
		await db.insert(clientNoteFilesSchema).values(
			data.fileIds.map((fileId) => ({ noteId, fileId })),
		);
	}

	const [user] = await db
		.select({ name: usersSchema.name })
		.from(usersSchema)
		.where(eq(usersSchema.id, note.createdById));

	const files = await getPresignedFiles(noteId);

	return {
		...note,
		createdByName: user?.name ?? "",
		createdByAvatar: null as string | null,
		files,
	};
}

export async function togglePinNote(noteId: string) {
	const [existing] = await db
		.select({ isPinned: clientNotesSchema.isPinned })
		.from(clientNotesSchema)
		.where(eq(clientNotesSchema.id, noteId));

	if (!existing) return null;

	const [updated] = await db
		.update(clientNotesSchema)
		.set({ isPinned: !existing.isPinned })
		.where(eq(clientNotesSchema.id, noteId))
		.returning();

	return updated;
}

export async function deleteClientNote(noteId: string) {
	const [deleted] = await db
		.update(clientNotesSchema)
		.set({ deletedAt: new Date() })
		.where(eq(clientNotesSchema.id, noteId))
		.returning();
	return deleted;
}
