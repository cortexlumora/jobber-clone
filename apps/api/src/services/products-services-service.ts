import db, { productsServicesSchema } from "@repo/db";
import type { CreateProductServiceForm, UpdateProductServiceForm } from "@repo/zod/product-service";
import type { PaginationQuery } from "@repo/zod/pagination";
import { and, eq, count, desc, ilike, type SQL } from "drizzle-orm";

export async function getProductsServices(userId: string, pagination: PaginationQuery) {
	const { page, limit, search } = pagination;
	const offset = (page - 1) * limit;

	const conditions: SQL[] = [eq(productsServicesSchema.userId, userId)];
	if (search) {
		conditions.push(ilike(productsServicesSchema.name, `%${search}%`));
	}

	const where = and(...conditions);

	const [items, [{ total }]] = await Promise.all([
		db
			.select()
			.from(productsServicesSchema)
			.where(where)
			.orderBy(desc(productsServicesSchema.createdAt))
			.limit(limit)
			.offset(offset),
		db
			.select({ total: count() })
			.from(productsServicesSchema)
			.where(where),
	]);

	return {
		data: items,
		pagination: {
			page,
			limit,
			total,
			totalPages: Math.ceil(total / limit),
		},
	};
}

export async function createProductService(userId: string, data: CreateProductServiceForm) {
	const [created] = await db.insert(productsServicesSchema).values({ userId, ...data }).returning();
	return created;
}

export async function updateProductService(userId: string, id: string, data: UpdateProductServiceForm) {
	const [updated] = await db
		.update(productsServicesSchema)
		.set(data)
		.where(and(eq(productsServicesSchema.id, id), eq(productsServicesSchema.userId, userId)))
		.returning();
	return updated;
}

export async function deleteProductService(userId: string, id: string) {
	const [deleted] = await db
		.delete(productsServicesSchema)
		.where(and(eq(productsServicesSchema.id, id), eq(productsServicesSchema.userId, userId)))
		.returning();
	return deleted;
}
