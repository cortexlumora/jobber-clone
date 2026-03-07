import db, { clientsSchema, clientContactsSchema, propertiesSchema } from "@repo/db";
import type { CreateClientForm } from "@repo/zod/client";
import { and, eq, isNull, sql } from "drizzle-orm";

export async function createClient(userId: string, data: CreateClientForm) {
	const { additionalContacts, properties, ...clientData } = data;

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
			notifications: clientData.notifications,
		})
		.returning();

	if (properties.length > 0) {
		await db.insert(propertiesSchema).values(
			properties.map((prop) => ({
				clientId: client.id,
				street1: prop.address.street1,
				street2: prop.address.street2,
				city: prop.address.city,
				state: prop.address.state,
				zip: prop.address.zip,
				country: prop.address.country,
				billingSameAsProperty: prop.billingSameAsProperty,
				billingStreet1: prop.billingSameAsProperty ? undefined : prop.billingAddress?.street1,
				billingStreet2: prop.billingSameAsProperty ? undefined : prop.billingAddress?.street2,
				billingCity: prop.billingSameAsProperty ? undefined : prop.billingAddress?.city,
				billingState: prop.billingSameAsProperty ? undefined : prop.billingAddress?.state,
				billingZip: prop.billingSameAsProperty ? undefined : prop.billingAddress?.zip,
				billingCountry: prop.billingSameAsProperty ? undefined : prop.billingAddress?.country,
			}))
		);
	}

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

export async function getClientProperties(clientId: string) {
	return db
		.select()
		.from(propertiesSchema)
		.where(eq(propertiesSchema.clientId, clientId));
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

export async function updateClient(clientId: string, data: CreateClientForm) {
	const { additionalContacts, properties, ...clientData } = data;

	const [client] = await db
		.update(clientsSchema)
		.set({
			title: clientData.title,
			firstName: clientData.firstName,
			lastName: clientData.lastName,
			companyName: clientData.companyName,
			leadSource: clientData.leadSource,
			useCompanyAsPrimary: clientData.useCompanyAsPrimary,
			phones: clientData.phones,
			emails: clientData.emails,
			notifications: clientData.notifications,
		})
		.where(eq(clientsSchema.id, clientId))
		.returning();

	// Delete existing properties and re-insert
	await db.delete(propertiesSchema).where(eq(propertiesSchema.clientId, clientId));
	if (properties.length > 0) {
		await db.insert(propertiesSchema).values(
			properties.map((prop) => ({
				clientId,
				street1: prop.address.street1,
				street2: prop.address.street2,
				city: prop.address.city,
				state: prop.address.state,
				zip: prop.address.zip,
				country: prop.address.country,
				billingSameAsProperty: prop.billingSameAsProperty,
				billingStreet1: prop.billingSameAsProperty ? undefined : prop.billingAddress?.street1,
				billingStreet2: prop.billingSameAsProperty ? undefined : prop.billingAddress?.street2,
				billingCity: prop.billingSameAsProperty ? undefined : prop.billingAddress?.city,
				billingState: prop.billingSameAsProperty ? undefined : prop.billingAddress?.state,
				billingZip: prop.billingSameAsProperty ? undefined : prop.billingAddress?.zip,
				billingCountry: prop.billingSameAsProperty ? undefined : prop.billingAddress?.country,
			}))
		);
	}

	// Delete existing contacts and re-insert
	await db.delete(clientContactsSchema).where(eq(clientContactsSchema.clientId, clientId));
	if (additionalContacts && additionalContacts.length > 0) {
		await db.insert(clientContactsSchema).values(
			additionalContacts.map((contact) => ({
				clientId,
				...contact,
			}))
		);
	}

	return client;
}

export async function archiveClient(clientId: string) {
	const [client] = await db
		.update(clientsSchema)
		.set({ archivedAt: new Date() })
		.where(eq(clientsSchema.id, clientId))
		.returning();

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
