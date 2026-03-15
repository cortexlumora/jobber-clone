import { zValidator } from "@hono/zod-validator";
import { createRequestSchema, updateRequestOverviewSchema, updateRequestLineItemsSchema, updateRequestAssessmentSchema } from "@repo/zod/request";
import type { APIResponse, RequestDTO, ClientNoteDTO } from "@repo/dto";
import { Hono } from "hono";
import { getUserIdFromCTX } from "../lib/helpers";
import {
	createRequest,
	getRequestById,
	getRequests,
	updateRequestOverview,
	updateRequestLineItems,
	updateRequestAssessment,
} from "../services/request-service";
import { getClientNotes } from "../services/client-note-service";

const requestRoute = new Hono()
	.post("/", zValidator("json", createRequestSchema), async (c) => {
		const data = c.req.valid("json");
		const userId = getUserIdFromCTX(c);

		const result = await createRequest(userId, data);
		return c.json<APIResponse<{ id: string }>>({ data: result });
	})
	.get("/", async (c) => {
		const requests = await getRequests();
		return c.json<APIResponse<RequestDTO[]>>({ data: requests });
	})
	.get("/:id", async (c) => {
		const requestId = c.req.param("id");

		const request = await getRequestById(requestId);
		return c.json<APIResponse<RequestDTO | null>>({ data: request });
	})
	.get("/:id/notes", async (c) => {
		const requestId = c.req.param("id");

		const request = await getRequestById(requestId);
		if (!request) return c.json<APIResponse<ClientNoteDTO[]>>({ data: [] });

		const notes = await getClientNotes(request.clientId, "requests");
		return c.json<APIResponse<ClientNoteDTO[]>>({ data: notes });
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
	})
	.put("/:id/assessment", zValidator("json", updateRequestAssessmentSchema), async (c) => {
		const requestId = c.req.param("id");
		const data = c.req.valid("json");

		const request = await updateRequestAssessment(requestId, data);
		return c.json<APIResponse<RequestDTO | null>>({ data: request });
	});

export default requestRoute;
