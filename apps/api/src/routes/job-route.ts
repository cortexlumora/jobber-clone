import { zValidator } from "@hono/zod-validator";
import { createJobSchema, updateJobLineItemsSchema } from "@repo/zod/job";
import { paginationSchema } from "@repo/zod/pagination";
import type { APIResponse, JobDTO, JobStatsDTO, JobInvoiceDTO, InvoiceReminderDTO, ClientNoteDTO, PaginatedResponse } from "@repo/dto";
import { Hono } from "hono";
import { getUserIdFromCTX } from "../lib/helpers";
import {
	createJob,
	getJobById,
	getJobs,
	updateJobLineItems,
	getJobStats,
} from "../services/job-service";
import { getClientNotes } from "../services/client-note-service";
import { getInvoicesByJobId } from "../services/invoice-service";
import { createInvoiceReminder, getInvoiceRemindersByJobId, deleteInvoiceReminder } from "../services/invoice-reminder-service";
import { createInvoiceReminderSchema } from "@repo/zod/invoice-reminder";

const jobRoute = new Hono()
	.get("/stats", async (c) => {
		const stats = await getJobStats();
		return c.json<APIResponse<JobStatsDTO>>({ data: stats });
	})
	.post("/", zValidator("json", createJobSchema), async (c) => {
		const data = c.req.valid("json");
		const userId = getUserIdFromCTX(c);

		const job = await createJob(userId, data);
		return c.json<APIResponse<{ id: string }>>({ data: job });
	})
	.get("/", zValidator("query", paginationSchema), async (c) => {
		const pagination = c.req.valid("query");
		const result = await getJobs(pagination);
		return c.json(result);
	})
	.get("/:id", async (c) => {
		const jobId = c.req.param("id");

		const job = await getJobById(jobId);
		return c.json<APIResponse<JobDTO | null>>({ data: job });
	})
	.get("/:id/notes", zValidator("query", paginationSchema), async (c) => {
		const jobId = c.req.param("id");
		const pagination = c.req.valid("query");

		const job = await getJobById(jobId);
		if (!job) return c.json<PaginatedResponse<ClientNoteDTO>>({ data: [], pagination: { page: 1, limit: pagination.limit, total: 0, totalPages: 0 } });

		const result = await getClientNotes(job.clientId, "jobs", pagination);
		return c.json<PaginatedResponse<ClientNoteDTO>>(result);
	})
	.get("/:id/invoices", zValidator("query", paginationSchema), async (c) => {
		const jobId = c.req.param("id");
		const pagination = c.req.valid("query");

		const result = await getInvoicesByJobId(jobId, pagination);
		return c.json<PaginatedResponse<JobInvoiceDTO>>(result);
	})
	.post("/:id/invoice-reminders", zValidator("json", createInvoiceReminderSchema), async (c) => {
		const jobId = c.req.param("id");
		const data = c.req.valid("json");

		const reminder = await createInvoiceReminder(jobId, data);
		return c.json<APIResponse<InvoiceReminderDTO>>({ data: reminder });
	})
	.get("/:id/invoice-reminders", zValidator("query", paginationSchema), async (c) => {
		const jobId = c.req.param("id");
		const pagination = c.req.valid("query");

		const result = await getInvoiceRemindersByJobId(jobId, pagination);
		return c.json(result);
	})
	.delete("/:id/invoice-reminders/:reminderId", async (c) => {
		const reminderId = c.req.param("reminderId");

		await deleteInvoiceReminder(reminderId);
		return c.json<APIResponse<null>>({ data: null });
	})
	.put("/:id/line-items", zValidator("json", updateJobLineItemsSchema), async (c) => {
		const jobId = c.req.param("id");
		const data = c.req.valid("json");

		const job = await updateJobLineItems(jobId, data);
		return c.json<APIResponse<JobDTO | null>>({ data: job });
	});

export default jobRoute;
