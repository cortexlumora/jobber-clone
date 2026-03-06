import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import type { APIResponse } from "@repo/dto";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { APIError } from "./lib/api-error";
import appRoutes from "./routes";

export function createApp() {
	const app = new Hono();
	app.use(logger());
	app.use("*", cors());

	app.onError((err, c) => {
		if (err instanceof APIError) {
			return c.json<APIResponse<null>>(
				{ data: null, error: err.message },
				err.statusCode as ContentfulStatusCode,
			);
		}
		console.error(`[Error] ${c.req.method} ${c.req.path}:`, err.message);
		return c.json<APIResponse<null>>({ data: null, error: "Internal server error" }, 500);
	});

	app.route("/api/v1", appRoutes);

	return app;
}
