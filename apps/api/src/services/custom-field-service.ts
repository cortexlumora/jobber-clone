import db, { customFieldDefinitionsSchema, customFieldValuesSchema } from "@repo/db";
import type { CreateCustomFieldForm, UpdateCustomFieldForm, SetCustomFieldValueForm } from "@repo/zod/custom-field";
import { and, eq, sql } from "drizzle-orm";

export async function getCustomFieldDefinitions(userId: string, appliesTo?: string) {
	const conditions = [eq(customFieldDefinitionsSchema.userId, userId)];
	if (appliesTo) {
		conditions.push(eq(customFieldDefinitionsSchema.appliesTo, appliesTo as "client" | "request" | "job"));
	}
	return db
		.select()
		.from(customFieldDefinitionsSchema)
		.where(and(...conditions))
		.orderBy(customFieldDefinitionsSchema.sortOrder);
}

export async function createCustomFieldDefinition(userId: string, data: CreateCustomFieldForm) {
	const [created] = await db
		.insert(customFieldDefinitionsSchema)
		.values({ userId, ...data })
		.returning();
	return created;
}

export async function updateCustomFieldDefinition(userId: string, id: string, data: UpdateCustomFieldForm) {
	const [updated] = await db
		.update(customFieldDefinitionsSchema)
		.set(data)
		.where(and(eq(customFieldDefinitionsSchema.id, id), eq(customFieldDefinitionsSchema.userId, userId)))
		.returning();
	return updated;
}

export async function deleteCustomFieldDefinition(userId: string, id: string) {
	const [deleted] = await db
		.delete(customFieldDefinitionsSchema)
		.where(and(eq(customFieldDefinitionsSchema.id, id), eq(customFieldDefinitionsSchema.userId, userId)))
		.returning();
	return deleted;
}

export async function reorderCustomFieldDefinitions(userId: string, items: { id: string; sortOrder: number }[]) {
	await Promise.all(
		items.map((item) =>
			db
				.update(customFieldDefinitionsSchema)
				.set({ sortOrder: item.sortOrder })
				.where(and(eq(customFieldDefinitionsSchema.id, item.id), eq(customFieldDefinitionsSchema.userId, userId)))
		)
	);
}

export async function getCustomFieldValues(entityType: string, entityId: string) {
	return db
		.select()
		.from(customFieldValuesSchema)
		.where(and(eq(customFieldValuesSchema.entityType, entityType), eq(customFieldValuesSchema.entityId, entityId)));
}

export async function setCustomFieldValue(data: SetCustomFieldValueForm) {
	const existing = await db
		.select()
		.from(customFieldValuesSchema)
		.where(
			and(
				eq(customFieldValuesSchema.customFieldId, data.customFieldId),
				eq(customFieldValuesSchema.entityType, data.entityType),
				eq(customFieldValuesSchema.entityId, data.entityId),
			)
		);

	if (existing.length > 0) {
		const [updated] = await db
			.update(customFieldValuesSchema)
			.set({ value: data.value })
			.where(eq(customFieldValuesSchema.id, existing[0].id))
			.returning();
		return updated;
	}

	const [created] = await db
		.insert(customFieldValuesSchema)
		.values(data)
		.returning();
	return created;
}
