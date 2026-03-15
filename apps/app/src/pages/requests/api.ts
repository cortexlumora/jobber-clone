import type { APIResponse, RequestDTO, ClientNoteDTO, PaginatedResponse } from "@repo/dto";
import type { CreateRequestForm, UpdateRequestOverviewForm, UpdateRequestLineItemsForm, UpdateRequestAssessmentForm } from "@repo/zod/request";
import { http } from "@/lib/http";

export async function createRequest(data: CreateRequestForm) {
	const res = await http.post<APIResponse<{ id: string }>>("/api/v1/requests", data);
	return res.data.data;
}

export async function getRequests() {
	const res = await http.get<APIResponse<RequestDTO[]>>("/api/v1/requests");
	return res.data.data;
}

export async function getRequestById(id: string) {
	const res = await http.get<APIResponse<RequestDTO | null>>(`/api/v1/requests/${id}`);
	return res.data.data;
}

export async function getRequestNotes(requestId: string, page = 1, limit = 20) {
	const res = await http.get<PaginatedResponse<ClientNoteDTO>>(`/api/v1/requests/${requestId}/notes`, {
		params: { page, limit },
	});
	return res.data;
}

export async function updateRequestOverview(id: string, data: UpdateRequestOverviewForm) {
	const res = await http.put<APIResponse<RequestDTO>>(`/api/v1/requests/${id}/overview`, data);
	return res.data.data;
}

export async function updateRequestLineItems(id: string, data: UpdateRequestLineItemsForm) {
	const res = await http.put<APIResponse<RequestDTO>>(`/api/v1/requests/${id}/line-items`, data);
	return res.data.data;
}

export async function updateRequestAssessment(id: string, data: UpdateRequestAssessmentForm) {
	const res = await http.put<APIResponse<RequestDTO>>(`/api/v1/requests/${id}/assessment`, data);
	return res.data.data;
}
