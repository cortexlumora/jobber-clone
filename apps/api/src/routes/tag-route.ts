import { zValidator } from "@hono/zod-validator";
import { createTagSchema } from "@repo/zod/tag";
import type { APIResponse, TagDTO } from "@repo/dto";
import { Hono } from "hono";
import { getUserIdFromCTX } from "../lib/helpers";
import {
	createTag,
	getTagsByUser,
	deleteTag,
} from "../services/tag-service";

const tagRoute = new Hono()
	.get("/", async (c) => {
		const userId = getUserIdFromCTX(c);
		const tags = await getTagsByUser(userId);
		return c.json<APIResponse<TagDTO[]>>({ data: tags });
	})
	.post("/", zValidator("json", createTagSchema), async (c) => {
		const userId = getUserIdFromCTX(c);
		const data = c.req.valid("json");
		const tag = await createTag(userId, data);
		return c.json<APIResponse<TagDTO>>({ data: tag }, 201);
	})
	.delete("/:id", async (c) => {
		const tagId = c.req.param("id");
		const tag = await deleteTag(tagId);
		return c.json<APIResponse<TagDTO>>({ data: tag });
	});

export default tagRoute;
