import { zValidator } from "@hono/zod-validator";
import { createClientSchema } from "@repo/zod/client";
import type { APIResponse, ClientDTO } from "@repo/dto";
import { Hono } from "hono";
import { getUserIdFromCTX } from "../lib/helpers";
import {
	createClient,
	deleteClient,
	getClientById,
	getClientsByUser,
} from "../services/client-service";

const clientRoute = new Hono()
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
	.delete("/:id", async (c) => {
		const clientId = c.req.param("id");

		const client = await deleteClient(clientId);
		return c.json<APIResponse<ClientDTO>>({ data: client });
	});

export default clientRoute;
