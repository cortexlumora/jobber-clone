import db, { invoicesSchema, invoiceLineItemsSchema } from "@repo/db";
import type { CreateInvoiceForm } from "@repo/zod/invoice";
import { and, eq, isNull } from "drizzle-orm";

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

export async function getInvoices() {
	const invoices = await db.select().from(invoicesSchema).where(isNull(invoicesSchema.deletedAt));

	const result = await Promise.all(
		invoices.map(async (invoice) => {
			const items = await db.select().from(invoiceLineItemsSchema).where(eq(invoiceLineItemsSchema.invoiceId, invoice.id));
			return { ...invoice, lineItems: items.map((item) => ({ ...item, image: null })) };
		}),
	);

	return result;
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
