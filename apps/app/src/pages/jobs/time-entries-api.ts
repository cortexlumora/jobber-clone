import type { APIResponse, TimeEntryDTO, PaginatedResponse } from "@repo/dto";
import type { CreateTimeEntryForm } from "@repo/zod/time-entry";
import { http } from "@/lib/http";

export async function createTimeEntry(jobId: string, data: CreateTimeEntryForm) {
	const res = await http.post<APIResponse<TimeEntryDTO>>(`/api/v1/jobs/${jobId}/time-entries`, data);
	return res.data.data;
}

export async function getTimeEntries(jobId: string, page = 1, limit = 10) {
	const res = await http.get<PaginatedResponse<TimeEntryDTO>>(`/api/v1/jobs/${jobId}/time-entries`, {
		params: { page, limit },
	});
	return res.data;
}

export async function updateTimeEntry(jobId: string, id: string, data: CreateTimeEntryForm) {
	const res = await http.put<APIResponse<TimeEntryDTO>>(`/api/v1/jobs/${jobId}/time-entries/${id}`, data);
	return res.data.data;
}

export async function deleteTimeEntry(jobId: string, id: string) {
	const res = await http.delete<APIResponse<null>>(`/api/v1/jobs/${jobId}/time-entries/${id}`);
	return res.data.data;
}
