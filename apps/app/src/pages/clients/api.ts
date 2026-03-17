import type { APIResponse, ClientDTO, ClientDetailDTO, ClientStatsDTO, ClientContactDTO, ClientNoteDTO, PaginatedResponse, PropertyDTO, TagDTO } from "@repo/dto";
import type { CreateClientForm } from "@repo/zod/client";
import type { CreateClientContactForm } from "@repo/zod/client-contact";
import type { CreateClientNoteForm, UpdateClientNoteForm } from "@repo/zod/client-note";
import { http } from "@/lib/http";

// Clients
export async function createClient(data: CreateClientForm) {
	const res = await http.post<APIResponse<ClientDTO>>("/api/v1/clients", data);
	return res.data.data;
}

export async function getClients() {
	const res = await http.get<APIResponse<ClientDTO[]>>("/api/v1/clients");
	return res.data.data;
}

export async function getClientById(id: string) {
	const res = await http.get<APIResponse<ClientDetailDTO | null>>(`/api/v1/clients/${id}`);
	return res.data.data;
}

export async function getClientStats() {
	const res = await http.get<APIResponse<ClientStatsDTO>>("/api/v1/clients/stats");
	return res.data.data;
}

export async function updateClient(id: string, data: CreateClientForm) {
	const res = await http.put<APIResponse<ClientDTO>>(`/api/v1/clients/${id}`, data);
	return res.data.data;
}

export async function getClientProperties(id: string, page = 1, limit = 20) {
	const res = await http.get<PaginatedResponse<PropertyDTO>>(`/api/v1/clients/${id}/properties`, {
		params: { page, limit },
	});
	return res.data;
}

export async function archiveClient(id: string) {
	const res = await http.patch<APIResponse<ClientDTO>>(`/api/v1/clients/${id}/archive`);
	return res.data.data;
}

export async function deleteClient(id: string) {
	const res = await http.delete<APIResponse<ClientDTO>>(`/api/v1/clients/${id}`);
	return res.data.data;
}

// Client Contacts
export async function getClientContacts(clientId: string, page = 1, limit = 20, search = "") {
	const res = await http.get<PaginatedResponse<ClientContactDTO>>(`/api/v1/clients/${clientId}/contacts`, {
		params: { page, limit, search },
	});
	return res.data;
}

export async function createClientContact(clientId: string, data: CreateClientContactForm) {
	const res = await http.post<APIResponse<ClientContactDTO>>(`/api/v1/clients/${clientId}/contacts`, data);
	return res.data.data;
}

export async function deleteClientContact(clientId: string, id: string) {
	const res = await http.delete<APIResponse<ClientContactDTO>>(`/api/v1/clients/${clientId}/contacts/${id}`);
	return res.data.data;
}

// Client Notes
export async function getClientNotes(clientId: string, page = 1, limit = 20) {
	const res = await http.get<PaginatedResponse<ClientNoteDTO>>(`/api/v1/clients/${clientId}/notes`, {
		params: { page, limit },
	});
	return res.data;
}

export async function createClientNote(clientId: string, data: CreateClientNoteForm) {
	const res = await http.post<APIResponse<ClientNoteDTO>>(`/api/v1/clients/${clientId}/notes`, data);
	return res.data.data;
}

export async function updateClientNote(clientId: string, noteId: string, data: UpdateClientNoteForm) {
	const res = await http.put<APIResponse<ClientNoteDTO>>(`/api/v1/clients/${clientId}/notes/${noteId}`, data);
	return res.data.data;
}

export async function togglePinNote(clientId: string, noteId: string) {
	const res = await http.patch<APIResponse<{ isPinned: boolean }>>(`/api/v1/clients/${clientId}/notes/${noteId}/pin`);
	return res.data.data;
}

export async function deleteClientNote(clientId: string, noteId: string) {
	const res = await http.delete<APIResponse<ClientNoteDTO>>(`/api/v1/clients/${clientId}/notes/${noteId}`);
	return res.data.data;
}

// Tags
export async function getTags() {
	const res = await http.get<APIResponse<TagDTO[]>>("/api/v1/tags");
	return res.data.data;
}

export async function createTag(data: { name: string; color?: string }) {
	const res = await http.post<APIResponse<TagDTO>>("/api/v1/tags", data);
	return res.data.data;
}

export async function assignTagToClient(clientId: string, tagId: string) {
	const res = await http.post<APIResponse<TagDTO[]>>(`/api/v1/clients/${clientId}/tags`, { tagId });
	return res.data.data;
}

export async function removeTagFromClient(clientId: string, tagId: string) {
	await http.delete(`/api/v1/clients/${clientId}/tags/${tagId}`);
}
