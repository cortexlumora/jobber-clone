import db, { expensesSchema } from "@repo/db";
import type { CreateExpenseForm } from "@repo/zod/expense";
import type { PaginationQuery } from "@repo/zod/pagination";
import { eq, sql } from "drizzle-orm";

export async function createExpense(jobId: string, data: CreateExpenseForm) {
	const [expense] = await db
		.insert(expensesSchema)
		.values({
			jobId,
			itemName: data.itemName,
			accountingCode: data.accountingCode || null,
			description: data.description || null,
			date: data.date,
			total: String(data.total.toFixed(2)),
			reimburseTo: data.reimburseTo || null,
		})
		.returning();

	return expense;
}

export async function getExpensesByJobId(jobId: string, pagination: PaginationQuery) {
	const { page, limit } = pagination;
	const offset = (page - 1) * limit;

	const where = eq(expensesSchema.jobId, jobId);

	const [data, [{ count }]] = await Promise.all([
		db.select().from(expensesSchema).where(where).limit(limit).offset(offset).orderBy(expensesSchema.createdAt),
		db.select({ count: sql<number>`count(*)` }).from(expensesSchema).where(where),
	]);

	return {
		data,
		pagination: {
			page,
			limit,
			total: Number(count),
			totalPages: Math.ceil(Number(count) / limit),
		},
	};
}

export async function deleteExpense(id: string) {
	await db.delete(expensesSchema).where(eq(expensesSchema.id, id));
}
