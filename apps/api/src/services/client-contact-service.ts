import db, { clientContactsSchema } from "@repo/db";
import type { CreateClientContactForm } from "@repo/zod/client-contact";
import type { PaginationQuery } from "@repo/zod/pagination";
import { and, eq, count, desc, or, ilike, type SQL } from "drizzle-orm";

export async function getClientContacts(clientId: string, pagination: PaginationQuery) {
	const { page, limit, search } = pagination;
	const offset = (page - 1) * limit;

	const conditions: SQL[] = [eq(clientContactsSchema.clientId, clientId)];
	if (search) {
		conditions.push(
			or(
				ilike(clientContactsSchema.firstName, `%${search}%`),
				ilike(clientContactsSchema.lastName, `%${search}%`),
				ilike(clientContactsSchema.email, `%${search}%`),
				ilike(clientContactsSchema.phone, `%${search}%`),
			)!,
		);
	}

	const where = and(...conditions);

	const [contacts, [{ total }]] = await Promise.all([
		db
			.select()
			.from(clientContactsSchema)
			.where(where)
			.orderBy(desc(clientContactsSchema.createdAt))
			.limit(limit)
			.offset(offset),
		db
			.select({ total: count() })
			.from(clientContactsSchema)
			.where(where),
	]);

	return {
		data: contacts,
		pagination: {
			page,
			limit,
			total,
			totalPages: Math.ceil(total / limit),
		},
	};
}

export async function createClientContact(clientId: string, data: CreateClientContactForm) {
	const [created] = await db
		.insert(clientContactsSchema)
		.values({ ...data, clientId })
		.returning();
	return created;
}

export async function deleteClientContact(clientId: string, id: string) {
	const [deleted] = await db
		.delete(clientContactsSchema)
		.where(and(eq(clientContactsSchema.id, id), eq(clientContactsSchema.clientId, clientId)))
		.returning();
	return deleted;
}
