import { zValidator } from "@hono/zod-validator";
import { createQuoteSchema, updateQuoteLineItemsSchema } from "@repo/zod/quote";
import { paginationSchema } from "@repo/zod/pagination";
import type { APIResponse, QuoteDTO, ClientNoteDTO, PaginatedResponse } from "@repo/dto";
import { Hono } from "hono";
import { getUserIdFromCTX } from "../lib/helpers";
import {
	createQuote,
	getQuoteById,
	getQuotesByUser,
	updateQuoteLineItems,
} from "../services/quote-service";
import { getClientNotes } from "../services/client-note-service";

const quoteRoute = new Hono()
	.post("/", zValidator("json", createQuoteSchema), async (c) => {
		const data = c.req.valid("json");
		const userId = getUserIdFromCTX(c);

		const quote = await createQuote(userId, data);
		return c.json<APIResponse<QuoteDTO>>({ data: quote });
	})
	.get("/", async (c) => {
		const userId = getUserIdFromCTX(c);

		const quotes = await getQuotesByUser(userId);
		return c.json<APIResponse<QuoteDTO[]>>({ data: quotes });
	})
	.get("/:id", async (c) => {
		const quoteId = c.req.param("id");

		const quote = await getQuoteById(quoteId);
		return c.json<APIResponse<QuoteDTO | null>>({ data: quote });
	})
	.get("/:id/notes", zValidator("query", paginationSchema), async (c) => {
		const quoteId = c.req.param("id");
		const pagination = c.req.valid("query");

		const quote = await getQuoteById(quoteId);
		if (!quote) return c.json<PaginatedResponse<ClientNoteDTO>>({ data: [], pagination: { page: 1, limit: pagination.limit, total: 0, totalPages: 0 } });

		const result = await getClientNotes(quote.clientId, "quotes", pagination);
		return c.json<PaginatedResponse<ClientNoteDTO>>(result);
	})
	.put("/:id/line-items", zValidator("json", updateQuoteLineItemsSchema), async (c) => {
		const quoteId = c.req.param("id");
		const data = c.req.valid("json");

		const quote = await updateQuoteLineItems(quoteId, data);
		return c.json<APIResponse<QuoteDTO | null>>({ data: quote });
	});

export default quoteRoute;
