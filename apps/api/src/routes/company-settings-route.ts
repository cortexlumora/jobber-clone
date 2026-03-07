import { zValidator } from "@hono/zod-validator";
import { updateCompanySettingsSchema } from "@repo/zod/company-settings";
import type { APIResponse, CompanySettingsDTO } from "@repo/dto";
import { Hono } from "hono";
import { getUserIdFromCTX } from "../lib/helpers";
import { getCompanySettings, upsertCompanySettings } from "../services/company-settings-service";

const companySettingsRoute = new Hono()
	.get("/", async (c) => {
		const userId = getUserIdFromCTX(c);
		const settings = await getCompanySettings(userId);
		return c.json<APIResponse<CompanySettingsDTO | null>>({ data: settings });
	})
	.put("/", zValidator("json", updateCompanySettingsSchema), async (c) => {
		const userId = getUserIdFromCTX(c);
		const data = c.req.valid("json");
		const settings = await upsertCompanySettings(userId, data);
		return c.json<APIResponse<CompanySettingsDTO>>({ data: settings });
	});

export default companySettingsRoute;
