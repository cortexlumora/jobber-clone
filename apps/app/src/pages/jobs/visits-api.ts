import type { APIResponse, VisitDTO } from "@repo/dto";
import type { CreateVisitForm } from "@repo/zod/visit";
import { http } from "@/lib/http";

export async function createVisit(jobId: string, data: CreateVisitForm) {
	const res = await http.post<APIResponse<VisitDTO>>(`/api/v1/jobs/${jobId}/visits`, data);
	return res.data.data;
}

export async function getVisitsByJobId(jobId: string) {
	const res = await http.get<APIResponse<VisitDTO[]>>(`/api/v1/jobs/${jobId}/visits`);
	return res.data.data;
}
