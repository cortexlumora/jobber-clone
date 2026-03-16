import { zValidator } from "@hono/zod-validator";
import { createInvoiceSchema } from "@repo/zod/invoice";
import { paginationSchema } from "@repo/zod/pagination";
import type { APIResponse, InvoiceDTO, InvoiceStatsDTO } from "@repo/dto";
import { Hono } from "hono";
import { createInvoice, getInvoices, getInvoiceById, getInvoiceStats } from "../services/invoice-service";

const invoiceRoute = new Hono()
	.get("/stats", async (c) => {
		const stats = await getInvoiceStats();
		return c.json<APIResponse<InvoiceStatsDTO>>({ data: stats });
	})
	.post("/", zValidator("json", createInvoiceSchema), async (c) => {
		const data = c.req.valid("json");

		const invoice = await createInvoice(data);
		return c.json<APIResponse<InvoiceDTO>>({ data: invoice });
	})
	.get("/", zValidator("query", paginationSchema), async (c) => {
		const pagination = c.req.valid("query");
		const result = await getInvoices(pagination);
		return c.json(result);
	})
	.get("/:id", async (c) => {
		const id = c.req.param("id");
		const invoice = await getInvoiceById(id);
		return c.json<APIResponse<InvoiceDTO | null>>({ data: invoice });
	});

export default invoiceRoute;
