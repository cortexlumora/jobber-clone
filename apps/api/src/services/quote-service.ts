import db, { quotesSchema, quoteFilesSchema, quoteLineItemsSchema, filesSchema } from "@repo/db";
import type { CreateQuoteForm, UpdateQuoteLineItemsForm } from "@repo/zod/quote";
import { and, eq, isNull, sql } from "drizzle-orm";
import { signKey } from "./file-service";
import { getClientNotes } from "./client-note-service";

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
		lineItems: insertedLineItems.map((item) => ({ ...item, image: null })),
		attachmentFileIds: attachmentFileIds ?? [],
		imageFileIds: imageFileIds ?? [],
		noteFileIds: noteFileIds ?? [],
		clientNotes: { data: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } },
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
			const [fileIds, items, clientNotes] = await Promise.all([
				getQuoteFiles(quote.id),
				db.select().from(quoteLineItemsSchema).where(eq(quoteLineItemsSchema.quoteId, quote.id)),
				getClientNotes(quote.clientId, "quotes", { page: 1, limit: 20, search: "" }),
			]);
			return { ...quote, lineItems: items.map((item) => ({ ...item, image: null })), clientNotes, ...fileIds };
		}),
	);

	return result;
}

async function getQuoteLineItemsByQuoteId(quoteId: string) {
	const items = await db
		.select({
			id: quoteLineItemsSchema.id,
			type: quoteLineItemsSchema.type,
			name: quoteLineItemsSchema.name,
			description: quoteLineItemsSchema.description,
			qty: quoteLineItemsSchema.qty,
			unitPrice: quoteLineItemsSchema.unitPrice,
			sortOrder: quoteLineItemsSchema.sortOrder,
			createdAt: quoteLineItemsSchema.createdAt,
			image: {
				id: filesSchema.id,
				name: filesSchema.name,
				contentType: filesSchema.contentType,
				key: filesSchema.key,
			},
		})
		.from(quoteLineItemsSchema)
		.leftJoin(filesSchema, eq(quoteLineItemsSchema.imageFileId, filesSchema.id))
		.where(eq(quoteLineItemsSchema.quoteId, quoteId));

	return Promise.all(
		items.map(async (item) => ({
			...item,
			image: item.image?.key
				? { id: item.image.id!, name: item.image.name!, contentType: item.image.contentType!, url: await signKey(item.image.key) }
				: null,
		})),
	);
}

export async function getQuoteById(quoteId: string) {
	const [quote] = await db
		.select()
		.from(quotesSchema)
		.where(and(eq(quotesSchema.id, quoteId), isNull(quotesSchema.deletedAt)));

	if (!quote) return null;

	const [fileIds, items, notesResult] = await Promise.all([
		getQuoteFiles(quote.id),
		getQuoteLineItemsByQuoteId(quote.id),
		getClientNotes(quote.clientId, "quotes", { page: 1, limit: 20, search: "" }),
	]);

	return { ...quote, lineItems: items, clientNotes: notesResult, ...fileIds };
}

export async function updateQuoteLineItems(quoteId: string, data: UpdateQuoteLineItemsForm) {
	await db.delete(quoteLineItemsSchema).where(eq(quoteLineItemsSchema.quoteId, quoteId));

	if (data.lineItems.length > 0) {
		await db.insert(quoteLineItemsSchema).values(
			data.lineItems.map((item, index) => ({
				quoteId,
				type: item.type,
				name: item.name,
				description: item.description || null,
				qty: item.qty,
				unitPrice: String(item.unitPrice),
				imageFileId: item.imageFileId || null,
				sortOrder: index,
			})),
		);
	}

	return getQuoteById(quoteId);
}

export async function getQuoteStats() {
	const now = new Date();
	const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);
	const sixtyDaysAgo = new Date(now.getTime() - 60 * 86400000);

	const [result] = await db
		.select({
			draftCount: sql<number>`count(*) filter (where ${quotesSchema.status} = 'draft')`,
			awaitingCount: sql<number>`count(*) filter (where ${quotesSchema.status} = 'sent')`,
			approvedCount: sql<number>`count(*) filter (where ${quotesSchema.status} = 'approved')`,
			sentLast30: sql<number>`count(*) filter (where ${quotesSchema.status} != 'draft' and ${quotesSchema.createdAt} >= ${thirtyDaysAgo})`,
			sentPrev30: sql<number>`count(*) filter (where ${quotesSchema.status} != 'draft' and ${quotesSchema.createdAt} >= ${sixtyDaysAgo} and ${quotesSchema.createdAt} < ${thirtyDaysAgo})`,
			convertedLast30: sql<number>`count(*) filter (where ${quotesSchema.status} = 'approved' and ${quotesSchema.updatedAt} >= ${thirtyDaysAgo})`,
			convertedPrev30: sql<number>`count(*) filter (where ${quotesSchema.status} = 'approved' and ${quotesSchema.updatedAt} >= ${sixtyDaysAgo} and ${quotesSchema.updatedAt} < ${thirtyDaysAgo})`,
		})
		.from(quotesSchema)
		.where(isNull(quotesSchema.deletedAt));

	const calcChange = (current: number, previous: number) => {
		if (previous === 0) return current > 0 ? 100 : 0;
		return Math.round(((current - previous) / previous) * 100);
	};

	return {
		draftCount: Number(result.draftCount),
		awaitingCount: Number(result.awaitingCount),
		approvedCount: Number(result.approvedCount),
		sentLast30: Number(result.sentLast30),
		sentLast30Change: calcChange(Number(result.sentLast30), Number(result.sentPrev30)),
		convertedLast30: Number(result.convertedLast30),
		convertedLast30Change: calcChange(Number(result.convertedLast30), Number(result.convertedPrev30)),
	};
}
