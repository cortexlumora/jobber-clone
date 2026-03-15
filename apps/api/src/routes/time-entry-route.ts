import { zValidator } from "@hono/zod-validator";
import { createTimeEntrySchema } from "@repo/zod/time-entry";
import { paginationSchema } from "@repo/zod/pagination";
import type { APIResponse, TimeEntryDTO, PaginatedResponse } from "@repo/dto";
import { Hono } from "hono";
import {
	createTimeEntry,
	updateTimeEntry,
	getTimeEntriesByJobId,
	deleteTimeEntry,
} from "../services/time-entry-service";

const timeEntryRoute = new Hono()
	.post("/:jobId/time-entries", zValidator("json", createTimeEntrySchema), async (c) => {
		const jobId = c.req.param("jobId");
		const data = c.req.valid("json");

		const entry = await createTimeEntry(jobId, data);
		return c.json<APIResponse<TimeEntryDTO>>({ data: entry });
	})
	.get("/:jobId/time-entries", zValidator("query", paginationSchema), async (c) => {
		const jobId = c.req.param("jobId");
		const pagination = c.req.valid("query");

		const result = await getTimeEntriesByJobId(jobId, pagination);
		return c.json<PaginatedResponse<TimeEntryDTO>>(result);
	})
	.put("/:jobId/time-entries/:id", zValidator("json", createTimeEntrySchema), async (c) => {
		const id = c.req.param("id");
		const data = c.req.valid("json");

		const entry = await updateTimeEntry(id, data);
		return c.json<APIResponse<TimeEntryDTO>>({ data: entry });
	})
	.delete("/:jobId/time-entries/:id", async (c) => {
		const id = c.req.param("id");

		await deleteTimeEntry(id);
		return c.json<APIResponse<null>>({ data: null });
	});

export default timeEntryRoute;
