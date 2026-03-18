import { zValidator } from "@hono/zod-validator";
import { createTimesheetEntrySchema, updateTimesheetEntrySchema, approveTimesheetsSchema, confirmPayrollSchema } from "@repo/zod/timesheet";
import { paginationSchema } from "@repo/zod/pagination";
import type { APIResponse, TimesheetEntryDTO, TimesheetApprovalSummaryDTO, PaginatedResponse } from "@repo/dto";
import { Hono } from "hono";
import { getUserIdFromCTX } from "../lib/helpers";
import {
	createTimesheetEntry,
	updateTimesheetEntry,
	deleteTimesheetEntry,
	getTimesheetEntries,
	getTimesheetEntriesByWeek,
	getPendingApprovals,
	approveTimesheets,
	getPayrollSummary,
	confirmPayroll,
	getPayrollPeriods,
} from "../services/timesheet-service";
import { z } from "zod";

const timesheetRoute = new Hono()
	// ── Entries ───────────────────────────────────────────────────────
	.post("/entries", zValidator("json", createTimesheetEntrySchema), async (c) => {
		const data = c.req.valid("json");
		const userId = getUserIdFromCTX(c);
		const entry = await createTimesheetEntry(userId, data);
		return c.json<APIResponse<typeof entry>>({ data: entry });
	})
	.get("/entries", zValidator("query", paginationSchema.extend({ date: z.string().optional(), weekStart: z.string().optional(), weekEnd: z.string().optional() })), async (c) => {
		const { date, weekStart, weekEnd, ...pagination } = c.req.valid("query");
		const userId = getUserIdFromCTX(c);

		if (weekStart && weekEnd) {
			const data = await getTimesheetEntriesByWeek(userId, weekStart, weekEnd);
			return c.json({ data });
		}

		const result = await getTimesheetEntries(userId, date || new Date().toISOString().slice(0, 10), pagination);
		return c.json(result);
	})
	.put("/entries/:id", zValidator("json", updateTimesheetEntrySchema), async (c) => {
		const entryId = c.req.param("id");
		const data = c.req.valid("json");
		const userId = getUserIdFromCTX(c);
		const entry = await updateTimesheetEntry(entryId, userId, data);
		return c.json<APIResponse<typeof entry>>({ data: entry });
	})
	.delete("/entries/:id", async (c) => {
		const entryId = c.req.param("id");
		const userId = getUserIdFromCTX(c);
		await deleteTimesheetEntry(entryId, userId);
		return c.json<APIResponse<null>>({ data: null });
	})

	// ── Approvals ────────────────────────────────────────────────────
	.get("/approvals", async (c) => {
		const data = await getPendingApprovals();
		return c.json<APIResponse<TimesheetApprovalSummaryDTO[]>>({ data });
	})
	.post("/approvals", zValidator("json", approveTimesheetsSchema), async (c) => {
		const data = c.req.valid("json");
		const userId = getUserIdFromCTX(c);
		await approveTimesheets(userId, data);
		return c.json<APIResponse<null>>({ data: null });
	})

	// ── Payroll ──────────────────────────────────────────────────────
	.get("/payroll/summary", async (c) => {
		const data = await getPayrollSummary();
		return c.json<APIResponse<typeof data>>({ data });
	})
	.post("/payroll/confirm", zValidator("json", confirmPayrollSchema), async (c) => {
		const data = c.req.valid("json");
		const userId = getUserIdFromCTX(c);
		const period = await confirmPayroll(userId, data);
		return c.json<APIResponse<typeof period>>({ data: period });
	})
	.get("/payroll", zValidator("query", paginationSchema), async (c) => {
		const pagination = c.req.valid("query");
		const result = await getPayrollPeriods(pagination);
		return c.json(result);
	});

export default timesheetRoute;
