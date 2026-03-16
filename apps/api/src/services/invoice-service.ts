import db, { invoicesSchema, invoiceLineItemsSchema, clientsSchema } from "@repo/db";
import type { CreateInvoiceForm } from "@repo/zod/invoice";
import type { PaginationQuery } from "@repo/zod/pagination";
import { and, desc, eq, isNull, sql } from "drizzle-orm";

export async function createInvoice(data: CreateInvoiceForm) {
	const { lineItems, ...invoiceData } = data;

	const subtotal = (lineItems ?? []).reduce((sum, item) => sum + item.qty * item.unitPrice, 0);
	const discountAmount = invoiceData.discount ? Number(invoiceData.discount) : 0;
	const taxAmount = invoiceData.tax ? Number(invoiceData.tax) : 0;
	const total = subtotal - discountAmount + taxAmount;

	const [invoice] = await db
		.insert(invoicesSchema)
		.values({
			clientId: invoiceData.clientId,
			jobId: invoiceData.jobId || null,
			invoiceNumber: invoiceData.invoiceNumber || null,
			status: "draft",
			subject: invoiceData.subject || null,
			issuedDate: invoiceData.issuedDate || null,
			dueDate: invoiceData.dueDate || null,
			discount: invoiceData.discount ? String(discountAmount.toFixed(2)) : null,
			tax: invoiceData.tax ? String(taxAmount.toFixed(2)) : null,
			clientMessage: invoiceData.clientMessage || null,
			subtotal: String(subtotal.toFixed(2)),
			total: String(total.toFixed(2)),
			amountPaid: "0",
			balance: String(total.toFixed(2)),
		})
		.returning();

	let insertedLineItems: (typeof invoiceLineItemsSchema.$inferSelect)[] = [];
	if (lineItems && lineItems.length > 0) {
		insertedLineItems = await db
			.insert(invoiceLineItemsSchema)
			.values(
				lineItems.map((item, index) => ({
					invoiceId: invoice.id,
					name: item.name,
					description: item.description || null,
					qty: item.qty,
					unitPrice: String(item.unitPrice),
					imageFileId: item.imageFileId || null,
					sortOrder: index,
				})),
			)
			.returning();
	}

	return { ...invoice, lineItems: insertedLineItems.map((item) => ({ ...item, image: null })) };
}

export async function getInvoices(pagination: PaginationQuery) {
	const { page, limit } = pagination;
	const offset = (page - 1) * limit;

	const where = isNull(invoicesSchema.deletedAt);

	const [rows, [{ count }]] = await Promise.all([
		db
			.select({
				id: invoicesSchema.id,
				clientId: invoicesSchema.clientId,
				jobId: invoicesSchema.jobId,
				invoiceNumber: invoicesSchema.invoiceNumber,
				status: invoicesSchema.status,
				subject: invoicesSchema.subject,
				dueDate: invoicesSchema.dueDate,
				total: invoicesSchema.total,
				balance: invoicesSchema.balance,
				createdAt: invoicesSchema.createdAt,
				client: {
					title: clientsSchema.title,
					firstName: clientsSchema.firstName,
					lastName: clientsSchema.lastName,
					companyName: clientsSchema.companyName,
					useCompanyAsPrimary: clientsSchema.useCompanyAsPrimary,
				},
			})
			.from(invoicesSchema)
			.innerJoin(clientsSchema, eq(invoicesSchema.clientId, clientsSchema.id))
			.where(where)
			.orderBy(desc(invoicesSchema.createdAt))
			.limit(limit)
			.offset(offset),
		db.select({ count: sql<number>`count(*)` }).from(invoicesSchema).where(where),
	]);

	const data = rows.map((row) => ({
		...row,
		client: row.client?.firstName ? row.client : null,
	}));

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

export async function getInvoiceStats() {
	const now = new Date();
	const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);
	const sixtyDaysAgo = new Date(now.getTime() - 60 * 86400000);

	const [result] = await db
		.select({
			pastDueCount: sql<number>`count(*) filter (where ${invoicesSchema.status} = 'overdue')`,
			pastDueAmount: sql<number>`coalesce(sum(${invoicesSchema.balance}::numeric) filter (where ${invoicesSchema.status} = 'overdue'), 0)`,
			sentCount: sql<number>`count(*) filter (where ${invoicesSchema.status} = 'sent')`,
			sentAmount: sql<number>`coalesce(sum(${invoicesSchema.balance}::numeric) filter (where ${invoicesSchema.status} = 'sent'), 0)`,
			draftCount: sql<number>`count(*) filter (where ${invoicesSchema.status} = 'draft')`,
			draftAmount: sql<number>`coalesce(sum(${invoicesSchema.total}::numeric) filter (where ${invoicesSchema.status} = 'draft'), 0)`,
			issuedLast30: sql<number>`count(*) filter (where ${invoicesSchema.issuedDate} is not null and ${invoicesSchema.createdAt} >= ${thirtyDaysAgo})`,
			issuedPrev30: sql<number>`count(*) filter (where ${invoicesSchema.issuedDate} is not null and ${invoicesSchema.createdAt} >= ${sixtyDaysAgo} and ${invoicesSchema.createdAt} < ${thirtyDaysAgo})`,
			totalLast30: sql<number>`coalesce(sum(${invoicesSchema.total}::numeric) filter (where ${invoicesSchema.issuedDate} is not null and ${invoicesSchema.createdAt} >= ${thirtyDaysAgo}), 0)`,
		})
		.from(invoicesSchema)
		.where(isNull(invoicesSchema.deletedAt));

	const calcChange = (current: number, previous: number) => {
		if (previous === 0) return current > 0 ? 100 : 0;
		return Math.round(((current - previous) / previous) * 100);
	};

	const issuedLast30 = Number(result.issuedLast30);
	const totalLast30 = Number(result.totalLast30);

	return {
		pastDueCount: Number(result.pastDueCount),
		pastDueAmount: Number(result.pastDueAmount),
		sentCount: Number(result.sentCount),
		sentAmount: Number(result.sentAmount),
		draftCount: Number(result.draftCount),
		draftAmount: Number(result.draftAmount),
		issuedLast30,
		issuedLast30Change: calcChange(issuedLast30, Number(result.issuedPrev30)),
		avgInvoiceLast30: issuedLast30 > 0 ? totalLast30 / issuedLast30 : 0,
	};
}

export async function getInvoiceById(invoiceId: string) {
	const [invoice] = await db
		.select()
		.from(invoicesSchema)
		.where(and(eq(invoicesSchema.id, invoiceId), isNull(invoicesSchema.deletedAt)));

	if (!invoice) return null;

	const items = await db.select().from(invoiceLineItemsSchema).where(eq(invoiceLineItemsSchema.invoiceId, invoice.id));

	return { ...invoice, lineItems: items.map((item) => ({ ...item, image: null })) };
}
