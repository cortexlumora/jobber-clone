import { zValidator } from "@hono/zod-validator";
import { createTimeEntrySchema } from "@repo/zod/time-entry";
import type { APIResponse, TimeEntryDTO } from "@repo/dto";
import { Hono } from "hono";
import {
	createTimeEntry,
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
	.get("/:jobId/time-entries", async (c) => {
		const jobId = c.req.param("jobId");

		const entries = await getTimeEntriesByJobId(jobId);
		return c.json<APIResponse<TimeEntryDTO[]>>({ data: entries });
	})
	.delete("/:jobId/time-entries/:id", async (c) => {
		const id = c.req.param("id");

		await deleteTimeEntry(id);
		return c.json<APIResponse<null>>({ data: null });
	});

export default timeEntryRoute;
