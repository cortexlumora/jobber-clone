import { zValidator } from "@hono/zod-validator";
import { createProductServiceSchema, updateProductServiceSchema } from "@repo/zod/product-service";
import { paginationSchema } from "@repo/zod/pagination";
import type { APIResponse, PaginatedResponse, ProductServiceDTO } from "@repo/dto";
import { Hono } from "hono";
import { getUserIdFromCTX } from "../lib/helpers";
import {
	getProductsServices,
	createProductService,
	updateProductService,
	deleteProductService,
} from "../services/products-services-service";

const productsServicesRoute = new Hono()
	.get("/", zValidator("query", paginationSchema), async (c) => {
		const userId = getUserIdFromCTX(c);
		const pagination = c.req.valid("query");
		const result = await getProductsServices(userId, pagination);
		return c.json<PaginatedResponse<ProductServiceDTO>>(result);
	})
	.post("/", zValidator("json", createProductServiceSchema), async (c) => {
		const userId = getUserIdFromCTX(c);
		const data = c.req.valid("json");
		const productService = await createProductService(userId, data);
		return c.json<APIResponse<ProductServiceDTO>>({ data: productService }, 201);
	})
	.put("/:id", zValidator("json", updateProductServiceSchema), async (c) => {
		const userId = getUserIdFromCTX(c);
		const id = c.req.param("id");
		const data = c.req.valid("json");
		const productService = await updateProductService(userId, id, data);
		return c.json<APIResponse<ProductServiceDTO>>({ data: productService! });
	})
	.delete("/:id", async (c) => {
		const userId = getUserIdFromCTX(c);
		const id = c.req.param("id");
		const deleted = await deleteProductService(userId, id);
		return c.json<APIResponse<ProductServiceDTO>>({ data: deleted! });
	});

export default productsServicesRoute;
