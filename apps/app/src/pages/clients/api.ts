import type { APIResponse, ClientDTO, ClientStatsDTO, ClientContactDTO, ClientNoteDTO, PropertyDTO } from "@repo/dto";
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
	const res = await http.get<APIResponse<ClientDTO>>(`/api/v1/clients/${id}`);
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

export async function getClientProperties(id: string) {
	const res = await http.get<APIResponse<PropertyDTO[]>>(`/api/v1/clients/${id}/properties`);
	return res.data.data;
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
export async function getClientContacts(clientId: string) {
	const res = await http.get<APIResponse<ClientContactDTO[]>>(`/api/v1/clients/${clientId}/contacts`);
	return res.data.data;
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
export async function getClientNotes(clientId: string) {
	const res = await http.get<APIResponse<ClientNoteDTO[]>>(`/api/v1/clients/${clientId}/notes`);
	return res.data.data;
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
