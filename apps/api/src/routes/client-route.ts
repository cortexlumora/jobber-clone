import { zValidator } from "@hono/zod-validator";
import { createClientSchema } from "@repo/zod/client";
import type { APIResponse, ClientDTO, ClientStatsDTO, PropertyDTO } from "@repo/dto";
import { Hono } from "hono";
import { getUserIdFromCTX } from "../lib/helpers";
import {
	archiveClient,
	createClient,
	deleteClient,
	getClientById,
	getClientProperties,
	getClientsByUser,
	getClientStats,
	updateClient,
} from "../services/client-service";

const clientRoute = new Hono()
	.get("/stats", async (c) => {
		const userId = getUserIdFromCTX(c);
		const stats = await getClientStats(userId);
		return c.json<APIResponse<ClientStatsDTO>>({ data: stats });
	})
	.post("/", zValidator("json", createClientSchema), async (c) => {
		const data = c.req.valid("json");
		const userId = getUserIdFromCTX(c);

		const client = await createClient(userId, data);
		return c.json<APIResponse<ClientDTO>>({ data: client });
	})
	.get("/", async (c) => {
		const userId = getUserIdFromCTX(c);

		const clients = await getClientsByUser(userId);
		return c.json<APIResponse<ClientDTO[]>>({ data: clients });
	})
	.get("/:id", async (c) => {
		const clientId = c.req.param("id");

		const client = await getClientById(clientId);
		return c.json<APIResponse<ClientDTO | null>>({ data: client ?? null });
	})
	.put("/:id", zValidator("json", createClientSchema), async (c) => {
		const clientId = c.req.param("id");
		const data = c.req.valid("json");

		const client = await updateClient(clientId, data);
		return c.json<APIResponse<ClientDTO>>({ data: client });
	})
	.get("/:id/properties", async (c) => {
		const clientId = c.req.param("id");

		const properties = await getClientProperties(clientId);
		return c.json<APIResponse<PropertyDTO[]>>({ data: properties });
	})
	.patch("/:id/archive", async (c) => {
		const clientId = c.req.param("id");

		const client = await archiveClient(clientId);
		return c.json<APIResponse<ClientDTO>>({ data: client });
	})
	.delete("/:id", async (c) => {
		const clientId = c.req.param("id");

		const client = await deleteClient(clientId);
		return c.json<APIResponse<ClientDTO>>({ data: client });
	});

export default clientRoute;
