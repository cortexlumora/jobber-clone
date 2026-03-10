import type { APIResponse, RequestDTO } from "@repo/dto";
import type { CreateRequestForm } from "@repo/zod/request";
import { http } from "@/lib/http";

export async function createRequest(data: CreateRequestForm) {
	const res = await http.post<APIResponse<RequestDTO>>("/api/v1/requests", data);
	return res.data.data;
}

export async function getRequests() {
	const res = await http.get<APIResponse<RequestDTO[]>>("/api/v1/requests");
	return res.data.data;
}
