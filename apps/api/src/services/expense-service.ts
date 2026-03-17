import db, { expensesSchema, filesSchema } from "@repo/db";
import type { CreateExpenseForm } from "@repo/zod/expense";
import type { PaginationQuery } from "@repo/zod/pagination";
import { desc, eq, sql } from "drizzle-orm";
import { signKey } from "./file-service";

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
			receiptFileId: data.receiptFileId || null,
		})
		.returning();

	return { ...expense, receipt: null };
}

export async function getExpensesByJobId(jobId: string, pagination: PaginationQuery) {
	const { page, limit } = pagination;
	const offset = (page - 1) * limit;

	const where = eq(expensesSchema.jobId, jobId);

	let [data, [{ count }]] = await Promise.all([
		db
			.select({
				id: expensesSchema.id,
				jobId: expensesSchema.jobId,
				itemName: expensesSchema.itemName,
				accountingCode: expensesSchema.accountingCode,
				description: expensesSchema.description,
				date: expensesSchema.date,
				total: expensesSchema.total,
				reimburseTo: expensesSchema.reimburseTo,
				receiptFileId: expensesSchema.receiptFileId,
				receipt: {
					id: filesSchema.id,
					key: filesSchema.key,
					contentType: filesSchema.contentType,
					name: filesSchema.name,
				},
				createdAt: expensesSchema.createdAt,
				updatedAt: expensesSchema.updatedAt,
			})
			.from(expensesSchema)
			.leftJoin(filesSchema, eq(expensesSchema.receiptFileId, filesSchema.id))
			.where(where)
			.limit(limit)
			.offset(offset)
			.orderBy(desc(expensesSchema.createdAt), desc(expensesSchema.id)),
		db
			.select({ count: sql<number>`count(*)` })
			.from(expensesSchema)
			.where(where),
	]);


	const result = await Promise.all(
		data.map(async (expense) => {
			if (expense.receipt?.id) {
				const { key, ...rest } = expense.receipt;
				return {
					...expense,
					receipt: {
						...rest,
						url: await signKey(key),
					},
				};
			}
			return { ...expense, receipt: null };
		}),
	);


	return {
		data: result,
		pagination: {
			page,
			limit,
			total: Number(count),
			totalPages: Math.ceil(Number(count) / limit),
		},
	};
}

export async function updateExpense(id: string, data: CreateExpenseForm) {
	const [expense] = await db
		.update(expensesSchema)
		.set({
			itemName: data.itemName,
			accountingCode: data.accountingCode || null,
			description: data.description || null,
			date: data.date,
			total: String(data.total.toFixed(2)),
			reimburseTo: data.reimburseTo || null,
			receiptFileId: data.receiptFileId || null,
		})
		.where(eq(expensesSchema.id, id))
		.returning();

	if (!expense.receiptFileId) return { ...expense, receipt: null };

	const [file] = await db
		.select({ id: filesSchema.id, key: filesSchema.key, contentType: filesSchema.contentType, name: filesSchema.name })
		.from(filesSchema)
		.where(eq(filesSchema.id, expense.receiptFileId));

	if (!file) return { ...expense, receipt: null };
	return { ...expense, receipt: { id: file.id, name: file.name, contentType: file.contentType, url: await signKey(file.key) } };
}

export async function deleteExpense(id: string) {
	await db.delete(expensesSchema).where(eq(expensesSchema.id, id));
}
