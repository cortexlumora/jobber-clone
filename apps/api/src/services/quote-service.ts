import db, { quotesSchema, quoteFilesSchema, quoteLineItemsSchema } from "@repo/db";
import type { CreateQuoteForm } from "@repo/zod/quote";
import { and, eq, isNull } from "drizzle-orm";

export async function createQuote(userId: string, data: CreateQuoteForm) {
	const { lineItems, attachmentFileIds, imageFileIds, noteFileIds, ...quoteData } = data;

	const [quote] = await db
		.insert(quotesSchema)
		.values({
			userId,
			clientId: quoteData.clientId,
			title: quoteData.title,
			quoteNumber: quoteData.quoteNumber || null,
			salesperson: quoteData.salesperson || null,
			introTitle: quoteData.introTitle || null,
			introDescription: quoteData.introDescription || null,
			introImageFileId: quoteData.introImageFileId || null,
			discount: quoteData.discount || null,
			tax: quoteData.tax || null,
			depositType: quoteData.depositType ?? "none",
			depositMode: quoteData.depositMode ?? "%",
			depositValue: quoteData.depositValue || null,
			scheduleMode: quoteData.scheduleMode ?? "%",
			payments: quoteData.payments ?? null,
			clientMessage: quoteData.clientMessage || null,
			contract: quoteData.contract || null,
			applyContractToAll: quoteData.applyContractToAll ?? false,
			notes: quoteData.notes || null,
		})
		.returning();

	// Insert line items
	let insertedLineItems: typeof quoteLineItemsSchema.$inferSelect[] = [];
	if (lineItems && lineItems.length > 0) {
		insertedLineItems = await db.insert(quoteLineItemsSchema).values(
			lineItems.map((item, index) => ({
				quoteId: quote.id,
				type: item.type,
				name: item.name,
				description: item.description || null,
				qty: item.qty,
				unitPrice: String(item.unitPrice),
				imageFileId: item.imageFileId || null,
				sortOrder: index,
			})),
		).returning();
	}

	// Insert file associations
	const fileInserts: { quoteId: string; fileId: string; category: string }[] = [];

	if (attachmentFileIds && attachmentFileIds.length > 0) {
		fileInserts.push(...attachmentFileIds.map((fileId) => ({ quoteId: quote.id, fileId, category: "attachment" })));
	}
	if (imageFileIds && imageFileIds.length > 0) {
		fileInserts.push(...imageFileIds.map((fileId) => ({ quoteId: quote.id, fileId, category: "image" })));
	}
	if (noteFileIds && noteFileIds.length > 0) {
		fileInserts.push(...noteFileIds.map((fileId) => ({ quoteId: quote.id, fileId, category: "note" })));
	}

	if (fileInserts.length > 0) {
		await db.insert(quoteFilesSchema).values(fileInserts);
	}

	return {
		...quote,
		lineItems: insertedLineItems,
		attachmentFileIds: attachmentFileIds ?? [],
		imageFileIds: imageFileIds ?? [],
		noteFileIds: noteFileIds ?? [],
	};
}

async function getQuoteFiles(quoteId: string) {
	const files = await db
		.select({ fileId: quoteFilesSchema.fileId, category: quoteFilesSchema.category })
		.from(quoteFilesSchema)
		.where(eq(quoteFilesSchema.quoteId, quoteId));

	return {
		attachmentFileIds: files.filter((f) => f.category === "attachment").map((f) => f.fileId),
		imageFileIds: files.filter((f) => f.category === "image").map((f) => f.fileId),
		noteFileIds: files.filter((f) => f.category === "note").map((f) => f.fileId),
	};
}

export async function getQuotesByUser(userId: string) {
	const quotes = await db
		.select()
		.from(quotesSchema)
		.where(and(eq(quotesSchema.userId, userId), isNull(quotesSchema.deletedAt)));

	const result = await Promise.all(
		quotes.map(async (quote) => {
			const fileIds = await getQuoteFiles(quote.id);
			const items = await db
				.select()
				.from(quoteLineItemsSchema)
				.where(eq(quoteLineItemsSchema.quoteId, quote.id));
			return { ...quote, lineItems: items, ...fileIds };
		}),
	);

	return result;
}

export async function getQuoteById(quoteId: string) {
	const [quote] = await db
		.select()
		.from(quotesSchema)
		.where(and(eq(quotesSchema.id, quoteId), isNull(quotesSchema.deletedAt)));

	if (!quote) return null;

	const fileIds = await getQuoteFiles(quote.id);
	const items = await db
		.select()
		.from(quoteLineItemsSchema)
		.where(eq(quoteLineItemsSchema.quoteId, quote.id));

	return { ...quote, lineItems: items, ...fileIds };
}
