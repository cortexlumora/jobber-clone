import { zValidator } from "@hono/zod-validator";
import { createRequestSchema } from "@repo/zod/request";
import type { APIResponse, RequestDTO } from "@repo/dto";
import { Hono } from "hono";
import { getUserIdFromCTX } from "../lib/helpers";
import {
	createRequest,
	getRequestById,
	getRequestsByUser,
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
	});

export default requestRoute;
