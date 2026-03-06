import db, { clientsSchema } from "@repo/db";
import type { CreateClientForm } from "@repo/zod/client";
import { and, eq, isNull } from "drizzle-orm";

export async function createClient(userId: string, data: CreateClientForm) {
	const [client] = await db
		.insert(clientsSchema)
		.values({
			userId,
			title: data.title,
			firstName: data.firstName,
			lastName: data.lastName,
			companyName: data.companyName,
			useCompanyAsPrimary: data.useCompanyAsPrimary,
			phones: data.phones,
			emails: data.emails,
			propertyAddress: data.propertyAddress,
			notifications: data.notifications,
			billingSameAsProperty: data.billingSameAsProperty,
			billingAddress: data.billingSameAsProperty ? undefined : data.billingAddress,
		})
		.returning();

	return client;
}

export async function getClientsByUser(userId: string) {
	return db
		.select()
		.from(clientsSchema)
		.where(and(eq(clientsSchema.userId, userId), isNull(clientsSchema.deletedAt)));
}

export async function getClientById(clientId: string) {
	const [client] = await db
		.select()
		.from(clientsSchema)
		.where(and(eq(clientsSchema.id, clientId), isNull(clientsSchema.deletedAt)));

	return client;
}

export async function deleteClient(clientId: string) {
	const [client] = await db
		.update(clientsSchema)
		.set({ deletedAt: new Date() })
		.where(eq(clientsSchema.id, clientId))
		.returning();

	return client;
}
