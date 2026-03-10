import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import db, { clientNotesSchema, clientNoteFilesSchema, filesSchema, usersSchema } from "@repo/db";
import type { CreateClientNoteForm } from "@repo/zod/client-note";
import type { ClientNoteFileDTO } from "@repo/dto";
import { eq, desc } from "drizzle-orm";
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

export async function createClientNote(userId: string, data: CreateClientNoteForm) {
	const [note] = await db
		.insert(clientNotesSchema)
		.values({
			clientId: data.clientId,
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

export async function getClientNotes(clientId: string) {
	const notes = await db
		.select({
			id: clientNotesSchema.id,
			clientId: clientNotesSchema.clientId,
			createdById: clientNotesSchema.createdById,
			createdByName: usersSchema.name,
			content: clientNotesSchema.content,
			relatedToRequests: clientNotesSchema.relatedToRequests,
			relatedToQuotes: clientNotesSchema.relatedToQuotes,
			relatedToJobs: clientNotesSchema.relatedToJobs,
			relatedToInvoices: clientNotesSchema.relatedToInvoices,
			createdAt: clientNotesSchema.createdAt,
			updatedAt: clientNotesSchema.updatedAt,
		})
		.from(clientNotesSchema)
		.innerJoin(usersSchema, eq(clientNotesSchema.createdById, usersSchema.id))
		.where(eq(clientNotesSchema.clientId, clientId))
		.orderBy(desc(clientNotesSchema.createdAt));

	return Promise.all(
		notes.map(async (note) => {
			const files = await getPresignedFiles(note.id);
			return { ...note, createdByAvatar: null as string | null, files };
		}),
	);
}

export async function deleteClientNote(noteId: string) {
	const [deleted] = await db
		.delete(clientNotesSchema)
		.where(eq(clientNotesSchema.id, noteId))
		.returning();
	return deleted;
}
