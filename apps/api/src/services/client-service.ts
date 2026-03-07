import db, { clientsSchema, clientContactsSchema } from "@repo/db";
import type { CreateClientForm } from "@repo/zod/client";
import { and, eq, gte, isNull, sql } from "drizzle-orm";

export async function createClient(userId: string, data: CreateClientForm) {
	const { additionalContacts, ...clientData } = data;

	const [client] = await db
		.insert(clientsSchema)
		.values({
			userId,
			title: clientData.title,
			firstName: clientData.firstName,
			lastName: clientData.lastName,
			companyName: clientData.companyName,
			leadSource: clientData.leadSource,
			useCompanyAsPrimary: clientData.useCompanyAsPrimary,
			phones: clientData.phones,
			emails: clientData.emails,
			propertyAddress: clientData.propertyAddress,
			notifications: clientData.notifications,
			billingSameAsProperty: clientData.billingSameAsProperty,
			billingAddress: clientData.billingSameAsProperty ? undefined : clientData.billingAddress,
		})
		.returning();

	if (additionalContacts && additionalContacts.length > 0) {
		await db.insert(clientContactsSchema).values(
			additionalContacts.map((contact) => ({
				clientId: client.id,
				...contact,
			}))
		);
	}

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

export async function getClientStats(userId: string) {
	const now = new Date();
	const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
	const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
	const yearStart = new Date(now.getFullYear(), 0, 1);

	const base = and(eq(clientsSchema.userId, userId), isNull(clientsSchema.deletedAt));

	const [result] = await db
		.select({
			newLeads: sql<number>`count(*) filter (where ${clientsSchema.status} = 'lead' and ${clientsSchema.createdAt} >= ${thirtyDaysAgo})`,
			prevLeads: sql<number>`count(*) filter (where ${clientsSchema.status} = 'lead' and ${clientsSchema.createdAt} >= ${sixtyDaysAgo} and ${clientsSchema.createdAt} < ${thirtyDaysAgo})`,
			newClients: sql<number>`count(*) filter (where ${clientsSchema.status} = 'active' and ${clientsSchema.createdAt} >= ${thirtyDaysAgo})`,
			prevClients: sql<number>`count(*) filter (where ${clientsSchema.status} = 'active' and ${clientsSchema.createdAt} >= ${sixtyDaysAgo} and ${clientsSchema.createdAt} < ${thirtyDaysAgo})`,
			totalNewClients: sql<number>`count(*) filter (where ${clientsSchema.status} = 'active' and ${clientsSchema.createdAt} >= ${yearStart})`,
		})
		.from(clientsSchema)
		.where(base);

	const calcChange = (current: number, previous: number) => {
		if (previous === 0) return current > 0 ? 100 : 0;
		return Math.round(((current - previous) / previous) * 100);
	};

	return {
		newLeads: Number(result.newLeads),
		newLeadsChange: calcChange(Number(result.newLeads), Number(result.prevLeads)),
		newClients: Number(result.newClients),
		newClientsChange: calcChange(Number(result.newClients), Number(result.prevClients)),
		totalNewClients: Number(result.totalNewClients),
	};
}

export async function deleteClient(clientId: string) {
	const [client] = await db
		.update(clientsSchema)
		.set({ deletedAt: new Date() })
		.where(eq(clientsSchema.id, clientId))
		.returning();

	return client;
}
