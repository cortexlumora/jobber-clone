import { zValidator } from "@hono/zod-validator";
import { createCustomFieldSchema, updateCustomFieldSchema, setCustomFieldValueSchema } from "@repo/zod/custom-field";
import type { APIResponse, CustomFieldDefinitionDTO, CustomFieldValueDTO } from "@repo/dto";
import { Hono } from "hono";
import { getUserIdFromCTX } from "../lib/helpers";
import {
	getCustomFieldDefinitions,
	createCustomFieldDefinition,
	updateCustomFieldDefinition,
	deleteCustomFieldDefinition,
	getCustomFieldValues,
	setCustomFieldValue,
} from "../services/custom-field-service";

const customFieldRoute = new Hono()
	.get("/definitions", async (c) => {
		const userId = getUserIdFromCTX(c);
		const appliesTo = c.req.query("appliesTo");
		const definitions = await getCustomFieldDefinitions(userId, appliesTo);
		return c.json<APIResponse<CustomFieldDefinitionDTO[]>>({ data: definitions });
	})
	.post("/definitions", zValidator("json", createCustomFieldSchema), async (c) => {
		const userId = getUserIdFromCTX(c);
		const data = c.req.valid("json");
		const definition = await createCustomFieldDefinition(userId, data);
		return c.json<APIResponse<CustomFieldDefinitionDTO>>({ data: definition }, 201);
	})
	.put("/definitions/:id", zValidator("json", updateCustomFieldSchema), async (c) => {
		const userId = getUserIdFromCTX(c);
		const id = c.req.param("id");
		const data = c.req.valid("json");
		const definition = await updateCustomFieldDefinition(userId, id, data);
		return c.json<APIResponse<CustomFieldDefinitionDTO>>({ data: definition });
	})
	.delete("/definitions/:id", async (c) => {
		const userId = getUserIdFromCTX(c);
		const id = c.req.param("id");
		const definition = await deleteCustomFieldDefinition(userId, id);
		return c.json<APIResponse<CustomFieldDefinitionDTO>>({ data: definition });
	})
	.get("/values/:entityType/:entityId", async (c) => {
		const { entityType, entityId } = c.req.param();
		const values = await getCustomFieldValues(entityType, entityId);
		return c.json<APIResponse<CustomFieldValueDTO[]>>({ data: values });
	})
	.post("/values", zValidator("json", setCustomFieldValueSchema), async (c) => {
		const data = c.req.valid("json");
		const value = await setCustomFieldValue(data);
		return c.json<APIResponse<CustomFieldValueDTO>>({ data: value }, 201);
	});

export default customFieldRoute;
