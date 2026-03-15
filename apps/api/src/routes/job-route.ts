import { zValidator } from "@hono/zod-validator";
import { createJobSchema, updateJobLineItemsSchema } from "@repo/zod/job";
import type { APIResponse, JobDTO, ClientNoteDTO } from "@repo/dto";
import { Hono } from "hono";
import { getUserIdFromCTX } from "../lib/helpers";
import {
	createJob,
	getJobById,
	getJobs,
	updateJobLineItems,
} from "../services/job-service";
import { getClientNotes } from "../services/client-note-service";

const jobRoute = new Hono()
	.post("/", zValidator("json", createJobSchema), async (c) => {
		const data = c.req.valid("json");
		const userId = getUserIdFromCTX(c);

		const job = await createJob(userId, data);
		return c.json<APIResponse<JobDTO>>({ data: job });
	})
	.get("/", async (c) => {
		const jobs = await getJobs();
		return c.json<APIResponse<JobDTO[]>>({ data: jobs });
	})
	.get("/:id", async (c) => {
		const jobId = c.req.param("id");

		const job = await getJobById(jobId);
		return c.json<APIResponse<JobDTO | null>>({ data: job });
	})
	.get("/:id/notes", async (c) => {
		const jobId = c.req.param("id");

		const job = await getJobById(jobId);
		if (!job) return c.json<APIResponse<ClientNoteDTO[]>>({ data: [] });

		const notes = await getClientNotes(job.clientId, "jobs");
		return c.json<APIResponse<ClientNoteDTO[]>>({ data: notes });
	})
	.put("/:id/line-items", zValidator("json", updateJobLineItemsSchema), async (c) => {
		const jobId = c.req.param("id");
		const data = c.req.valid("json");

		const job = await updateJobLineItems(jobId, data);
		return c.json<APIResponse<JobDTO | null>>({ data: job });
	});

export default jobRoute;
