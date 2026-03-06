import { zValidator } from "@hono/zod-validator";
import { presignUploadSchema } from "@repo/zod/file";
import type { APIResponse, PresignUploadDTO } from "@repo/dto";
import { Hono } from "hono";
import { presignUpload } from "../services/file-service";

const fileRoute = new Hono()
	.post("/presign", zValidator("json", presignUploadSchema), async (c) => {
		const { fileName, contentType } = c.req.valid("json");

		const result = await presignUpload(fileName, contentType);
		return c.json<APIResponse<PresignUploadDTO>>({ data: result });
	});

export default fileRoute;
