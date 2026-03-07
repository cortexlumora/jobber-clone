import type { APIResponse, ClientDTO, ClientStatsDTO, CompanySettingsDTO, PresignUploadDTO, RequestDTO } from "@repo/dto";
import type { CreateClientForm } from "@repo/zod/client";
import type { CreateRequestForm } from "@repo/zod/request";
import type { UpdateCompanySettingsForm } from "@repo/zod/company-settings";
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
