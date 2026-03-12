import db, { requestFormsSchema, bookableServicesSchema, requestsBookingsSettingsSchema } from "@repo/db";
import type { CreateRequestFormForm } from "@repo/zod/request-form";
import type { CreateBookableServiceForm, UpdateBookableServiceForm } from "@repo/zod/bookable-service";
import type { UpdateRequestsBookingsSettingsForm } from "@repo/zod/requests-bookings-settings";
import { eq, and } from "drizzle-orm";

// Request Forms
export async function getRequestForms(userId: string) {
	return db.select().from(requestFormsSchema).where(eq(requestFormsSchema.userId, userId));
}

export async function createRequestForm(userId: string, data: CreateRequestFormForm) {
	const [form] = await db.insert(requestFormsSchema).values({ userId, ...data }).returning();
	return form;
}

export async function deleteRequestForm(userId: string, id: string) {
	const [deleted] = await db
		.delete(requestFormsSchema)
		.where(and(eq(requestFormsSchema.id, id), eq(requestFormsSchema.userId, userId)))
		.returning();
	return deleted;
}

// Bookable Services
export async function getBookableServices(userId: string) {
	return db.select().from(bookableServicesSchema).where(eq(bookableServicesSchema.userId, userId));
}

export async function createBookableService(userId: string, data: CreateBookableServiceForm) {
	const [service] = await db.insert(bookableServicesSchema).values({ userId, ...data }).returning();
	return service;
}

export async function updateBookableService(userId: string, id: string, data: UpdateBookableServiceForm) {
	const [updated] = await db
		.update(bookableServicesSchema)
		.set(data)
		.where(and(eq(bookableServicesSchema.id, id), eq(bookableServicesSchema.userId, userId)))
		.returning();
	return updated;
}

export async function deleteBookableService(userId: string, id: string) {
	const [deleted] = await db
		.delete(bookableServicesSchema)
		.where(and(eq(bookableServicesSchema.id, id), eq(bookableServicesSchema.userId, userId)))
		.returning();
	return deleted;
}

// Settings
export async function getRequestsBookingsSettings(userId: string) {
	const [settings] = await db
		.select()
		.from(requestsBookingsSettingsSchema)
		.where(eq(requestsBookingsSettingsSchema.userId, userId));
	return settings ?? null;
}

export async function upsertRequestsBookingsSettings(userId: string, data: UpdateRequestsBookingsSettingsForm) {
	const existing = await getRequestsBookingsSettings(userId);

	if (existing) {
		const [updated] = await db
			.update(requestsBookingsSettingsSchema)
			.set(data)
			.where(eq(requestsBookingsSettingsSchema.userId, userId))
			.returning();
		return updated;
	}

	const [created] = await db
		.insert(requestsBookingsSettingsSchema)
		.values({ userId, ...data })
		.returning();
	return created;
}
