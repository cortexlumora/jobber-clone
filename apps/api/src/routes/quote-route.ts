import { zValidator } from "@hono/zod-validator";
import { createQuoteSchema } from "@repo/zod/quote";
import type { APIResponse, QuoteDTO } from "@repo/dto";
import { Hono } from "hono";
import { getUserIdFromCTX } from "../lib/helpers";
import {
	createQuote,
	getQuoteById,
	getQuotesByUser,
} from "../services/quote-service";

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
	});

export default quoteRoute;
