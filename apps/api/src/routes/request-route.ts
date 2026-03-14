import { zValidator } from "@hono/zod-validator";
import { createRequestSchema, updateRequestOverviewSchema, updateRequestLineItemsSchema } from "@repo/zod/request";
import type { APIResponse, RequestDTO } from "@repo/dto";
import { Hono } from "hono";
import { getUserIdFromCTX } from "../lib/helpers";
import {
	createRequest,
	getRequestById,
	getRequestsByUser,
	updateRequestOverview,
	updateRequestLineItems,
} from "../services/request-service";

const requestRoute = new Hono()
	.post("/", zValidator("json", createRequestSchema), async (c) => {
		const data = c.req.valid("json");
		const userId = getUserIdFromCTX(c);

		const request = await createRequest(userId, data);
		return c.json<APIResponse<RequestDTO>>({ data: request });
	})
	.get("/", async (c) => {
		const userId = getUserIdFromCTX(c);

		const requests = await getRequestsByUser(userId);
		return c.json<APIResponse<RequestDTO[]>>({ data: requests });
	})
	.get("/:id", async (c) => {
		const requestId = c.req.param("id");

		const request = await getRequestById(requestId);
		return c.json<APIResponse<RequestDTO | null>>({ data: request });
	})
	.put("/:id/overview", zValidator("json", updateRequestOverviewSchema), async (c) => {
		const requestId = c.req.param("id");
		const data = c.req.valid("json");

		const request = await updateRequestOverview(requestId, data);
		return c.json<APIResponse<RequestDTO | null>>({ data: request });
	})
	.put("/:id/line-items", zValidator("json", updateRequestLineItemsSchema), async (c) => {
		const requestId = c.req.param("id");
		const data = c.req.valid("json");

		const request = await updateRequestLineItems(requestId, data);
		return c.json<APIResponse<RequestDTO | null>>({ data: request });
	});

export default requestRoute;
