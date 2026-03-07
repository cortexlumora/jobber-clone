import db, { clientContactsSchema } from "@repo/db";
import type { CreateClientContactForm } from "@repo/zod/client-contact";
import { and, eq } from "drizzle-orm";

export async function getClientContacts(clientId: string) {
	return db
		.select()
		.from(clientContactsSchema)
		.where(eq(clientContactsSchema.clientId, clientId));
}

export async function createClientContact(data: CreateClientContactForm) {
	const [created] = await db
		.insert(clientContactsSchema)
		.values(data)
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
