import db, { requestsSchema, quotesSchema, jobsSchema } from "@repo/db";
import { and, eq, isNull, sql } from "drizzle-orm";
import type { DashboardDTO } from "@repo/dto";

export async function getDashboardData(userId: string): Promise<DashboardDTO> {
	// Requests
	const requestRows = await db
		.select({ status: requestsSchema.status, count: sql<number>`count(*)::int` })
		.from(requestsSchema)
		.where(and(eq(requestsSchema.userId, userId), isNull(requestsSchema.deletedAt)))
		.groupBy(requestsSchema.status);

	const requestCounts = Object.fromEntries(requestRows.map((r) => [r.status, r.count]));

	// Quotes
	const quoteRows = await db
		.select({ status: quotesSchema.status, count: sql<number>`count(*)::int` })
		.from(quotesSchema)
		.where(and(eq(quotesSchema.userId, userId), isNull(quotesSchema.deletedAt)))
		.groupBy(quotesSchema.status);

	const quoteCounts = Object.fromEntries(quoteRows.map((r) => [r.status, r.count]));

	// Jobs
	const jobRows = await db
		.select({ status: jobsSchema.status, count: sql<number>`count(*)::int` })
		.from(jobsSchema)
		.where(and(eq(jobsSchema.userId, userId), isNull(jobsSchema.deletedAt)))
		.groupBy(jobsSchema.status);

	const jobCounts = Object.fromEntries(jobRows.map((r) => [r.status, r.count]));

	return {
		requests: {
			new: requestCounts["new"] ?? 0,
			assessmentsComplete: requestCounts["assessed"] ?? 0,
			overdue: 0, // TODO: define overdue logic
		},
		quotes: {
			approved: quoteCounts["approved"] ?? 0,
			draft: quoteCounts["draft"] ?? 0,
			changesRequested: 0, // TODO: no "changes_requested" status yet
		},
		jobs: {
			requiresInvoicing: jobCounts["complete"] ?? 0,
			active: jobCounts["active"] ?? 0,
			actionRequired: jobCounts["action_required"] ?? 0,
		},
		invoices: {
			awaitingPayment: 0, // TODO: no invoices table yet
			draft: 0,
			pastDue: 0,
		},
	};
}
