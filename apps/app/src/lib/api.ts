import type { APIResponse, ClientDTO } from "@repo/dto";
import type { CreateClientForm } from "@repo/zod/client";
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

export async function deleteClient(id: string) {
	const res = await http.delete<APIResponse<ClientDTO>>(`/api/v1/clients/${id}`);
	return res.data.data;
}
