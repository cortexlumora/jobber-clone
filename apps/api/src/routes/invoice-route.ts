import { zValidator } from "@hono/zod-validator";
import { createInvoiceSchema } from "@repo/zod/invoice";
import type { APIResponse, InvoiceDTO } from "@repo/dto";
import { Hono } from "hono";
import { createInvoice, getInvoices, getInvoiceById } from "../services/invoice-service";

const invoiceRoute = new Hono()
	.post("/", zValidator("json", createInvoiceSchema), async (c) => {
		const data = c.req.valid("json");

		const invoice = await createInvoice(data);
		return c.json<APIResponse<InvoiceDTO>>({ data: invoice });
	})
	.get("/", async (c) => {
		const invoices = await getInvoices();
		return c.json<APIResponse<InvoiceDTO[]>>({ data: invoices });
	})
	.get("/:id", async (c) => {
		const id = c.req.param("id");
		const invoice = await getInvoiceById(id);
		return c.json<APIResponse<InvoiceDTO | null>>({ data: invoice });
	});

export default invoiceRoute;
