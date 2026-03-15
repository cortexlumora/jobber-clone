import { zValidator } from "@hono/zod-validator";
import { createClientSchema } from "@repo/zod/client";
import { createClientContactSchema } from "@repo/zod/client-contact";
import { createClientNoteSchema, updateClientNoteSchema } from "@repo/zod/client-note";
import { assignTagSchema } from "@repo/zod/tag";
import { paginationSchema } from "@repo/zod/pagination";
import type { APIResponse, ClientContactDTO, ClientDTO, ClientDetailDTO, ClientNoteDTO, ClientStatsDTO, PaginatedResponse, PropertyDTO, TagDTO } from "@repo/dto";
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
	getClientContacts,
	createClientContact,
	deleteClientContact,
} from "../services/client-contact-service";
import {
	createClientNote,
	getClientNotes,
	updateClientNote,
	togglePinNote,
	deleteClientNote,
} from "../services/client-note-service";
import {
	getClientTags,
	assignTagToClient,
	removeTagFromClient,
} from "../services/tag-service";

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
		return c.json<APIResponse<ClientDetailDTO | null>>({ data: client });
	})
	.put("/:id", zValidator("json", createClientSchema), async (c) => {
		const clientId = c.req.param("id");
		const data = c.req.valid("json");

		const client = await updateClient(clientId, data);
		return c.json<APIResponse<ClientDTO>>({ data: client });
	})
	.get("/:id/properties", zValidator("query", paginationSchema), async (c) => {
		const clientId = c.req.param("id");
		const pagination = c.req.valid("query");

		const result = await getClientProperties(clientId, pagination);
		return c.json<PaginatedResponse<PropertyDTO>>(result);
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
	// Contacts
	.get("/:id/contacts", zValidator("query", paginationSchema), async (c) => {
		const clientId = c.req.param("id");
		const pagination = c.req.valid("query");
		const result = await getClientContacts(clientId, pagination);
		return c.json<PaginatedResponse<ClientContactDTO>>(result);
	})
	.post("/:id/contacts", zValidator("json", createClientContactSchema), async (c) => {
		const clientId = c.req.param("id");
		const data = c.req.valid("json");
		const contact = await createClientContact(clientId, data);
		return c.json<APIResponse<ClientContactDTO>>({ data: contact }, 201);
	})
	.delete("/:id/contacts/:contactId", async (c) => {
		const clientId = c.req.param("id");
		const contactId = c.req.param("contactId");
		const contact = await deleteClientContact(clientId, contactId);
		return c.json<APIResponse<ClientContactDTO>>({ data: contact });
	})
	// Notes
	.get("/:id/notes", zValidator("query", paginationSchema), async (c) => {
		const clientId = c.req.param("id");
		const relatedTo = c.req.query("relatedTo") as "all" | "requests" | "quotes" | "jobs" | "invoices" | undefined;
		const pagination = c.req.valid("query");

		const result = await getClientNotes(clientId, relatedTo, pagination);
		return c.json<PaginatedResponse<ClientNoteDTO>>(result);
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
	})
	// Tags
	.get("/:id/tags", async (c) => {
		const clientId = c.req.param("id");
		const tags = await getClientTags(clientId);
		return c.json<APIResponse<TagDTO[]>>({ data: tags });
	})
	.post("/:id/tags", zValidator("json", assignTagSchema), async (c) => {
		const clientId = c.req.param("id");
		const { tagId } = c.req.valid("json");
		await assignTagToClient(clientId, tagId);
		const tags = await getClientTags(clientId);
		return c.json<APIResponse<TagDTO[]>>({ data: tags });
	})
	.delete("/:id/tags/:tagId", async (c) => {
		const clientId = c.req.param("id");
		const tagId = c.req.param("tagId");
		await removeTagFromClient(clientId, tagId);
		return c.json<APIResponse<null>>({ data: null });
	});

export default clientRoute;
