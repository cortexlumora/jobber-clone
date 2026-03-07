import type { APIResponse, ClientDTO, ClientStatsDTO, ClientContactDTO, CompanySettingsDTO, CustomFieldDefinitionDTO, PresignUploadDTO, RequestDTO } from "@repo/dto";
import type { CreateClientForm } from "@repo/zod/client";
import type { CreateRequestForm } from "@repo/zod/request";
import type { UpdateCompanySettingsForm } from "@repo/zod/company-settings";
import type { CreateCustomFieldForm } from "@repo/zod/custom-field";
import type { CreateClientContactForm } from "@repo/zod/client-contact";
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
