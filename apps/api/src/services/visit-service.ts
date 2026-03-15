import db, { visitsSchema } from "@repo/db";
import type { CreateVisitForm } from "@repo/zod/visit";
import { eq } from "drizzle-orm";

export async function createVisit(jobId: string, data: CreateVisitForm) {
	const [visit] = await db
		.insert(visitsSchema)
		.values({
			jobId,
			title: data.title,
			instructions: data.instructions || null,
			startDate: data.startDate || null,
			endDate: data.endDate || null,
			startTime: data.startTime || null,
			endTime: data.endTime || null,
			scheduleLater: data.scheduleLater ?? false,
			anytime: data.anytime ?? false,
			assignedTo: data.assignedTo || null,
			emailOnAssign: data.emailOnAssign ?? false,
			teamReminder: data.teamReminder ?? "none",
		})
		.returning();

	return visit;
}

export async function getVisitsByJobId(jobId: string) {
	return db
		.select()
		.from(visitsSchema)
		.where(eq(visitsSchema.jobId, jobId));
}

export async function getVisitById(visitId: string) {
	const [visit] = await db
		.select()
		.from(visitsSchema)
		.where(eq(visitsSchema.id, visitId));

	return visit ?? null;
}

export async function updateVisitStatus(visitId: string, status: "scheduled" | "completed" | "cancelled") {
	const [visit] = await db
		.update(visitsSchema)
		.set({ status })
		.where(eq(visitsSchema.id, visitId))
		.returning();

	return visit ?? null;
}

export async function deleteVisit(visitId: string) {
	await db.delete(visitsSchema).where(eq(visitsSchema.id, visitId));
}
