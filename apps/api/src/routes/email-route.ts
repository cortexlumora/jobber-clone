import { zValidator } from "@hono/zod-validator";
import { sendEmailSchema } from "@repo/zod/email";
import type { APIResponse, EmailLogDTO } from "@repo/dto";
import { Hono } from "hono";
import { sendResourceEmail } from "../services/email-service";

const emailRoute = new Hono()
	.post("/send", zValidator("json", sendEmailSchema), async (c) => {
		const data = c.req.valid("json");

		const log = await sendResourceEmail({
			resourceType: data.resourceType,
			resourceId: data.resourceId,
			to: data.to,
			subject: data.subject,
			message: data.message,
			sendCopyToSelf: data.sendCopyToSelf,
		});

		return c.json<APIResponse<EmailLogDTO>>({ data: log });
	});

export default emailRoute;
