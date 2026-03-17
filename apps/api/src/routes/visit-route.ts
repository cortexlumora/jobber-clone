import { zValidator } from "@hono/zod-validator";
import { createVisitSchema } from "@repo/zod/visit";
import type { APIResponse, VisitDTO } from "@repo/dto";
import { Hono } from "hono";
import {
	createVisit,
	getVisitsByJobId,
	getVisitById,
	updateVisitStatus,
	deleteVisit,
} from "../services/visit-service";
import { z } from "zod";

const visitRoute = new Hono()
	.post("/:jobId/visits", zValidator("json", createVisitSchema), async (c) => {
		const jobId = c.req.param("jobId");
		const data = c.req.valid("json");

		const visit = await createVisit(jobId, data);
		return c.json<APIResponse<VisitDTO>>({ data: visit });
	})
	.get("/:jobId/visits", async (c) => {
		const jobId = c.req.param("jobId");

		const visits = await getVisitsByJobId(jobId);
		return c.json<APIResponse<VisitDTO[]>>({ data: visits });
	})
	.get("/:jobId/visits/:visitId", async (c) => {
		const visitId = c.req.param("visitId");

		const visit = await getVisitById(visitId);
		return c.json<APIResponse<VisitDTO | null>>({ data: visit });
	})
	.patch("/:jobId/visits/:visitId/status", zValidator("json", z.object({ status: z.enum(["scheduled", "completed", "cancelled"]) })), async (c) => {
		const visitId = c.req.param("visitId");
		const { status } = c.req.valid("json");

		const visit = await updateVisitStatus(visitId, status);
		return c.json<APIResponse<VisitDTO | null>>({ data: visit });
	})
	.delete("/:jobId/visits/:visitId", async (c) => {
		const visitId = c.req.param("visitId");

		await deleteVisit(visitId);
		return c.json<APIResponse<null>>({ data: null });
	});

export default visitRoute;
