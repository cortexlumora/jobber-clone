import { zValidator } from "@hono/zod-validator";
import { createClientContactSchema } from "@repo/zod/client-contact";
import type { APIResponse, ClientContactDTO } from "@repo/dto";
import { Hono } from "hono";
import {
	getClientContacts,
	createClientContact,
	deleteClientContact,
} from "../services/client-contact-service";

const clientContactRoute = new Hono()
	.get("/:clientId", async (c) => {
		const clientId = c.req.param("clientId");
		const contacts = await getClientContacts(clientId);
		return c.json<APIResponse<ClientContactDTO[]>>({ data: contacts });
	})
	.post("/", zValidator("json", createClientContactSchema), async (c) => {
		const data = c.req.valid("json");
		const contact = await createClientContact(data);
		return c.json<APIResponse<ClientContactDTO>>({ data: contact }, 201);
	})
	.delete("/:clientId/:id", async (c) => {
		const { clientId, id } = c.req.param();
		const contact = await deleteClientContact(clientId, id);
		return c.json<APIResponse<ClientContactDTO>>({ data: contact });
	});

export default clientContactRoute;
