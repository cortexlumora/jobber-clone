import db, { tagsSchema, clientTagsSchema } from "@repo/db";
import type { CreateTagForm } from "@repo/zod/tag";
import { and, eq, sql } from "drizzle-orm";

export async function createTag(userId: string, data: CreateTagForm) {
	const [tag] = await db
		.insert(tagsSchema)
		.values({ userId, ...data })
		.returning();

	return tag;
}

export async function getTagsByUser(userId: string) {
	return db
		.select()
		.from(tagsSchema)
		.where(eq(tagsSchema.userId, userId))
		.orderBy(tagsSchema.name);
}

export async function getClientTags(clientId: string) {
	return db
		.select({
			id: tagsSchema.id,
			name: tagsSchema.name,
			color: tagsSchema.color,
			createdAt: tagsSchema.createdAt,
		})
		.from(clientTagsSchema)
		.innerJoin(tagsSchema, eq(clientTagsSchema.tagId, tagsSchema.id))
		.where(eq(clientTagsSchema.clientId, clientId));
}

export async function assignTagToClient(clientId: string, tagId: string) {
	await db
		.insert(clientTagsSchema)
		.values({ clientId, tagId })
		.onConflictDoNothing();
}

export async function removeTagFromClient(clientId: string, tagId: string) {
	await db
		.delete(clientTagsSchema)
		.where(and(eq(clientTagsSchema.clientId, clientId), eq(clientTagsSchema.tagId, tagId)));

	// Delete the tag if no clients are using it
	const [{ count }] = await db
		.select({ count: sql<number>`count(*)` })
		.from(clientTagsSchema)
		.where(eq(clientTagsSchema.tagId, tagId));

	if (Number(count) === 0) {
		await db.delete(tagsSchema).where(eq(tagsSchema.id, tagId));
	}
}

export async function deleteTag(tagId: string) {
	const [tag] = await db
		.delete(tagsSchema)
		.where(eq(tagsSchema.id, tagId))
		.returning();

	return tag;
}
