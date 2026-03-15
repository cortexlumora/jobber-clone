import type { APIResponse, TimeEntryDTO } from "@repo/dto";
import type { CreateTimeEntryForm } from "@repo/zod/time-entry";
import { http } from "@/lib/http";

export async function createTimeEntry(jobId: string, data: CreateTimeEntryForm) {
	const res = await http.post<APIResponse<TimeEntryDTO>>(`/api/v1/jobs/${jobId}/time-entries`, data);
	return res.data.data;
}

export async function deleteTimeEntry(jobId: string, id: string) {
	const res = await http.delete<APIResponse<null>>(`/api/v1/jobs/${jobId}/time-entries/${id}`);
	return res.data.data;
}
