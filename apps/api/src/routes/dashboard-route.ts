import type { APIResponse, DashboardDTO } from "@repo/dto";
import { Hono } from "hono";
import { getUserIdFromCTX } from "../lib/helpers";
import { getDashboardData } from "../services/dashboard-service";

const dashboardRoute = new Hono()
	.get("/", async (c) => {
		const userId = getUserIdFromCTX(c);
		const data = await getDashboardData(userId);
		return c.json<APIResponse<DashboardDTO>>({ data });
	});

export default dashboardRoute;
