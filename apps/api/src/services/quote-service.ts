import db, { quotesSchema, quoteFilesSchema, quoteLineItemsSchema, filesSchema, clientsSchema, propertiesSchema, requestsSchema } from "@repo/db";
import type { CreateQuoteForm, UpdateQuoteLineItemsForm, UpdateQuoteFilesForm } from "@repo/zod/quote";
import type { PaginationQuery } from "@repo/zod/pagination";
import { and, desc, eq, isNull, sql, inArray } from "drizzle-orm";
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
			relatedRequestId: quoteData.relatedRequestId || null,
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

	// Mark related request as converted
	if (quoteData.relatedRequestId) {
		await db.update(requestsSchema).set({ status: "converted" }).where(eq(requestsSchema.id, quoteData.relatedRequestId));
	}

	return {
		...quote,
		lineItems: insertedLineItems.map((item) => ({ ...item, image: null })),
		attachmentFileIds: attachmentFileIds ?? [],
		imageFileIds: imageFileIds ?? [],
		noteFileIds: noteFileIds ?? [],
		attachments: [],
		images: [],
		noteFiles: [],
		clientNotes: { data: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } },
	};
}

async function getQuoteFiles(quoteId: string) {
	const files = await db
		.select({ fileId: quoteFilesSchema.fileId, category: quoteFilesSchema.category, fileName: filesSchema.name })
		.from(quoteFilesSchema)
		.innerJoin(filesSchema, eq(quoteFilesSchema.fileId, filesSchema.id))
		.where(eq(quoteFilesSchema.quoteId, quoteId));

	const byCategory = (cat: string) => files.filter((f) => f.category === cat);
	const toFileDTO = (f: (typeof files)[number]) => ({ id: f.fileId, name: f.fileName });

	return {
		attachmentFileIds: byCategory("attachment").map((f) => f.fileId),
		imageFileIds: byCategory("image").map((f) => f.fileId),
		noteFileIds: byCategory("note").map((f) => f.fileId),
		attachments: byCategory("attachment").map(toFileDTO),
		images: byCategory("image").map(toFileDTO),
		noteFiles: byCategory("note").map(toFileDTO),
	};
}

export async function getQuotes(pagination: PaginationQuery) {
	const { page, limit } = pagination;
	const offset = (page - 1) * limit;

	const where = isNull(quotesSchema.deletedAt);

	const [rows, [{ count }]] = await Promise.all([
		db
			.select({
				id: quotesSchema.id,
				clientId: quotesSchema.clientId,
				title: quotesSchema.title,
				quoteNumber: quotesSchema.quoteNumber,
				salesperson: quotesSchema.salesperson,
				status: quotesSchema.status,
				discount: quotesSchema.discount,
				tax: quotesSchema.tax,
				createdAt: quotesSchema.createdAt,
				client: {
					title: clientsSchema.title,
					firstName: clientsSchema.firstName,
					lastName: clientsSchema.lastName,
					companyName: clientsSchema.companyName,
					useCompanyAsPrimary: clientsSchema.useCompanyAsPrimary,
					phones: clientsSchema.phones,
					emails: clientsSchema.emails,
				},
			})
			.from(quotesSchema)
			.innerJoin(clientsSchema, eq(quotesSchema.clientId, clientsSchema.id))
			.where(where)
			.orderBy(desc(quotesSchema.createdAt))
			.limit(limit)
			.offset(offset),
		db.select({ count: sql<number>`count(*)` }).from(quotesSchema).where(where),
	]);

	const clientIds = [...new Set(rows.map((r) => r.clientId))];
	const quoteIds = rows.map((r) => r.id);

	const [properties, lineItems] = await Promise.all([
		clientIds.length > 0
			? db.selectDistinctOn([propertiesSchema.clientId], {
					clientId: propertiesSchema.clientId,
					street1: propertiesSchema.street1,
					street2: propertiesSchema.street2,
					city: propertiesSchema.city,
					state: propertiesSchema.state,
					zip: propertiesSchema.zip,
				}).from(propertiesSchema).where(sql`${propertiesSchema.clientId} in ${clientIds}`)
			: Promise.resolve([]),
		quoteIds.length > 0
			? db.select({ quoteId: quoteLineItemsSchema.quoteId, qty: quoteLineItemsSchema.qty, unitPrice: quoteLineItemsSchema.unitPrice }).from(quoteLineItemsSchema).where(sql`${quoteLineItemsSchema.quoteId} in ${quoteIds}`)
			: Promise.resolve([]),
	]);

	const propertyMap = new Map(properties.map((p) => [p.clientId, p]));
	const subtotalMap = new Map<string, number>();
	for (const item of lineItems) {
		subtotalMap.set(item.quoteId, (subtotalMap.get(item.quoteId) ?? 0) + item.qty * Number(item.unitPrice));
	}

	const data = rows.map((row) => {
		const subtotal = subtotalMap.get(row.id) ?? 0;
		const total = subtotal - (row.discount ? Number(row.discount) : 0) + (row.tax ? Number(row.tax) : 0);
		return { ...row, client: row.client?.firstName ? row.client : null, property: propertyMap.get(row.clientId) ?? null, total };
	});

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

export async function updateQuoteFiles(quoteId: string, data: UpdateQuoteFilesForm) {
	if (data.removedFileIds.length > 0) {
		await db
			.delete(quoteFilesSchema)
			.where(and(eq(quoteFilesSchema.quoteId, quoteId), inArray(quoteFilesSchema.fileId, data.removedFileIds)));
	}

	if (data.addedFileIds.length > 0) {
		await db.insert(quoteFilesSchema).values(
			data.addedFileIds.map((fileId) => ({ quoteId, fileId, category: data.category })),
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
