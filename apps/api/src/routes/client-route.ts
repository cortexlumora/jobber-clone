import { zValidator } from "@hono/zod-validator";
import { createClientSchema } from "@repo/zod/client";
import { createClientNoteSchema, updateClientNoteSchema } from "@repo/zod/client-note";
import type { APIResponse, ClientDTO, ClientNoteDTO, ClientStatsDTO, PropertyDTO } from "@repo/dto";
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
import {
	createClientNote,
	getClientNotes,
	updateClientNote,
	togglePinNote,
	deleteClientNote,
} from "../services/client-note-service";

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
	})
	// Notes
	.get("/:id/notes", async (c) => {
		const clientId = c.req.param("id");

		const notes = await getClientNotes(clientId);
		return c.json<APIResponse<ClientNoteDTO[]>>({ data: notes });
	})
	.post("/:id/notes", zValidator("json", createClientNoteSchema), async (c) => {
		const clientId = c.req.param("id");
		const data = c.req.valid("json");
		const userId = getUserIdFromCTX(c);

		const note = await createClientNote(userId, clientId, data);
		return c.json<APIResponse<ClientNoteDTO>>({ data: note });
	})
	.put("/:id/notes/:noteId", zValidator("json", updateClientNoteSchema), async (c) => {
		const noteId = c.req.param("noteId");
		const data = c.req.valid("json");

		const note = await updateClientNote(noteId, data);
		if (!note) {
			return c.json<APIResponse<null>>({ data: null });
		}
		return c.json<APIResponse<ClientNoteDTO>>({ data: note });
	})
	.patch("/:id/notes/:noteId/pin", async (c) => {
		const noteId = c.req.param("noteId");

		const note = await togglePinNote(noteId);
		if (!note) {
			return c.json<APIResponse<null>>({ data: null });
		}
		return c.json<APIResponse<{ isPinned: boolean }>>({ data: { isPinned: note.isPinned } });
	})
	.delete("/:id/notes/:noteId", async (c) => {
		const noteId = c.req.param("noteId");

		const deleted = await deleteClientNote(noteId);
		if (!deleted) {
			return c.json<APIResponse<null>>({ data: null });
		}
		return c.json<APIResponse<ClientNoteDTO>>({
			data: {
				...deleted,
				createdByName: "",
				createdByAvatar: null,
				files: [],
			},
		});
	});

export default clientRoute;
