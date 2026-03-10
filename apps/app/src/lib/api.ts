import type { APIResponse, ClientDTO, ClientStatsDTO, ClientContactDTO, ClientNoteDTO, CompanySettingsDTO, CustomFieldDefinitionDTO, PropertyDTO, PresignUploadDTO, RequestDTO, TeamMemberDTO, QuoteDTO, JobDTO } from "@repo/dto";
import type { CreateClientForm } from "@repo/zod/client";
import type { CreateRequestForm } from "@repo/zod/request";
import type { UpdateCompanySettingsForm } from "@repo/zod/company-settings";
import type { CreateCustomFieldForm } from "@repo/zod/custom-field";
import type { CreateClientContactForm } from "@repo/zod/client-contact";
import type { InviteTeamMemberForm, AcceptInviteForm } from "@repo/zod/team";
import type { CreateQuoteForm } from "@repo/zod/quote";
import type { CreateJobForm } from "@repo/zod/job";
import type { CreateClientNoteForm, UpdateClientNoteForm } from "@repo/zod/client-note";
import axios from "axios";
import { http } from "./http";

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

// Files
export async function presignUpload(fileName: string, contentType: string) {
	const res = await http.post<APIResponse<PresignUploadDTO>>("/api/v1/files/presign", { fileName, contentType });
	return res.data.data;
}

export async function uploadFileToS3(uploadUrl: string, file: File) {
	await axios.put(uploadUrl, file, {
		headers: { "Content-Type": file.type },
	});
}

// Requests
export async function createRequest(data: CreateRequestForm) {
	const res = await http.post<APIResponse<RequestDTO>>("/api/v1/requests", data);
	return res.data.data;
}

export async function getRequests() {
	const res = await http.get<APIResponse<RequestDTO[]>>("/api/v1/requests");
	return res.data.data;
}

// Company Settings
export async function getCompanySettings() {
	const res = await http.get<APIResponse<CompanySettingsDTO | null>>("/api/v1/company-settings");
	return res.data.data;
}

export async function updateCompanySettings(data: UpdateCompanySettingsForm) {
	const res = await http.put<APIResponse<CompanySettingsDTO>>("/api/v1/company-settings", data);
	return res.data.data;
}

// Custom Fields
export async function getCustomFieldDefinitions(appliesTo?: string) {
	const params = appliesTo ? `?appliesTo=${appliesTo}` : "";
	const res = await http.get<APIResponse<CustomFieldDefinitionDTO[]>>(`/api/v1/custom-fields/definitions${params}`);
	return res.data.data;
}

export async function createCustomFieldDefinition(data: CreateCustomFieldForm) {
	const res = await http.post<APIResponse<CustomFieldDefinitionDTO>>("/api/v1/custom-fields/definitions", data);
	return res.data.data;
}

export async function deleteCustomFieldDefinition(id: string) {
	const res = await http.delete<APIResponse<CustomFieldDefinitionDTO>>(`/api/v1/custom-fields/definitions/${id}`);
	return res.data.data;
}

// Client Contacts
export async function getClientContacts(clientId: string) {
	const res = await http.get<APIResponse<ClientContactDTO[]>>(`/api/v1/client-contacts/${clientId}`);
	return res.data.data;
}

export async function createClientContact(data: CreateClientContactForm) {
	const res = await http.post<APIResponse<ClientContactDTO>>("/api/v1/client-contacts", data);
	return res.data.data;
}

export async function deleteClientContact(clientId: string, id: string) {
	const res = await http.delete<APIResponse<ClientContactDTO>>(`/api/v1/client-contacts/${clientId}/${id}`);
	return res.data.data;
}

// Team
export async function getTeamMembers() {
	const res = await http.get<APIResponse<TeamMemberDTO[]>>("/api/v1/team");
	return res.data.data;
}

export async function inviteTeamMember(data: InviteTeamMemberForm) {
	const res = await http.post<APIResponse<{ user: TeamMemberDTO; inviteToken: string }>>("/api/v1/team/invite", data);
	return res.data.data;
}

export async function getInviteByToken(token: string) {
	const res = await http.get<APIResponse<{ id: string; name: string; email: string }>>(`/api/v1/team/invite/${token}`);
	return res.data.data;
}

export async function acceptInvite(data: AcceptInviteForm) {
	const res = await http.post<APIResponse<TeamMemberDTO>>("/api/v1/team/invite/accept", data);
	return res.data.data;
}

// Quotes
export async function createQuote(data: CreateQuoteForm) {
	const res = await http.post<APIResponse<QuoteDTO>>("/api/v1/quotes", data);
	return res.data.data;
}

export async function getQuotes() {
	const res = await http.get<APIResponse<QuoteDTO[]>>("/api/v1/quotes");
	return res.data.data;
}

export async function getQuoteById(id: string) {
	const res = await http.get<APIResponse<QuoteDTO | null>>(`/api/v1/quotes/${id}`);
	return res.data.data;
}

// Jobs
export async function createJob(data: CreateJobForm) {
	const res = await http.post<APIResponse<JobDTO>>("/api/v1/jobs", data);
	return res.data.data;
}

export async function getJobs() {
	const res = await http.get<APIResponse<JobDTO[]>>("/api/v1/jobs");
	return res.data.data;
}

export async function getJobById(id: string) {
	const res = await http.get<APIResponse<JobDTO | null>>(`/api/v1/jobs/${id}`);
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
