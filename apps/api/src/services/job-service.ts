import db, { jobsSchema, jobFilesSchema, jobLineItemsSchema } from "@repo/db";
import type { CreateJobForm, UpdateJobLineItemsForm } from "@repo/zod/job";
import { and, eq, isNull } from "drizzle-orm";

export async function createJob(userId: string, data: CreateJobForm) {
	const { lineItems, noteFileIds, ...jobData } = data;

	const [job] = await db
		.insert(jobsSchema)
		.values({
			userId,
			clientId: jobData.clientId,
			title: jobData.title,
			jobNumber: jobData.jobNumber || null,
			salesperson: jobData.salesperson || null,
			jobType: jobData.jobType ?? "one_off",
			startDate: jobData.startDate || null,
			startTime: jobData.startTime || null,
			endTime: jobData.endTime || null,
			repeats: jobData.repeats || null,
			repeatDays: jobData.repeatDays ?? null,
			endsType: jobData.endsType ?? null,
			endsAfterVisits: jobData.endsAfterVisits ?? null,
			endsOnDate: jobData.endsOnDate || null,
			visitInstructions: jobData.visitInstructions || null,
			assignedUserIds: jobData.assignedUserIds ?? null,
			billingType: jobData.billingType ?? null,
			invoiceFrequency: jobData.invoiceFrequency || null,
			autoPay: jobData.autoPay ?? false,
			notes: jobData.notes || null,
			relatedQuoteId: jobData.relatedQuoteId || null,
			relatedRequestId: jobData.relatedRequestId || null,
		})
		.returning();

	let insertedLineItems: typeof jobLineItemsSchema.$inferSelect[] = [];
	if (lineItems && lineItems.length > 0) {
		insertedLineItems = await db.insert(jobLineItemsSchema).values(
			lineItems.map((item, index) => ({
				jobId: job.id,
				name: item.name,
				description: item.description || null,
				qty: item.qty,
				unitCost: String(item.unitCost),
				unitPrice: String(item.unitPrice),
				imageFileId: item.imageFileId || null,
				sortOrder: index,
			})),
		).returning();
	}

	if (noteFileIds && noteFileIds.length > 0) {
		await db.insert(jobFilesSchema).values(
			noteFileIds.map((fileId) => ({
				jobId: job.id,
				fileId,
			})),
		);
	}

	return { ...job, lineItems: insertedLineItems, fileIds: noteFileIds ?? [] };
}

export async function getJobsByUser(userId: string) {
	const jobs = await db
		.select()
		.from(jobsSchema)
		.where(and(eq(jobsSchema.userId, userId), isNull(jobsSchema.deletedAt)));

	const result = await Promise.all(
		jobs.map(async (job) => {
			const files = await db
				.select({ fileId: jobFilesSchema.fileId })
				.from(jobFilesSchema)
				.where(eq(jobFilesSchema.jobId, job.id));
			const items = await db
				.select()
				.from(jobLineItemsSchema)
				.where(eq(jobLineItemsSchema.jobId, job.id));
			return { ...job, lineItems: items, fileIds: files.map((f) => f.fileId) };
		}),
	);

	return result;
}

export async function getJobById(jobId: string) {
	const [job] = await db
		.select()
		.from(jobsSchema)
		.where(and(eq(jobsSchema.id, jobId), isNull(jobsSchema.deletedAt)));

	if (!job) return null;

	const files = await db
		.select({ fileId: jobFilesSchema.fileId })
		.from(jobFilesSchema)
		.where(eq(jobFilesSchema.jobId, job.id));

	const items = await db
		.select()
		.from(jobLineItemsSchema)
		.where(eq(jobLineItemsSchema.jobId, job.id));

	return { ...job, lineItems: items, fileIds: files.map((f) => f.fileId) };
}

export async function updateJobLineItems(jobId: string, data: UpdateJobLineItemsForm) {
	await db.delete(jobLineItemsSchema).where(eq(jobLineItemsSchema.jobId, jobId));

	if (data.lineItems.length > 0) {
		await db.insert(jobLineItemsSchema).values(
			data.lineItems.map((item, index) => ({
				jobId,
				name: item.name,
				description: item.description || null,
				qty: item.qty,
				unitCost: String(item.unitCost),
				unitPrice: String(item.unitPrice),
				imageFileId: item.imageFileId || null,
				sortOrder: index,
			})),
		);
	}

	return getJobById(jobId);
}
