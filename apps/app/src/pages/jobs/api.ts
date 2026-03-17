import type { APIResponse, JobDTO, JobListItemDTO, JobInvoiceDTO, JobStatsDTO, ClientNoteDTO, PaginatedResponse } from "@repo/dto";
import type { CreateJobForm, UpdateJobLineItemsForm } from "@repo/zod/job";
import { http } from "@/lib/http";

export async function getJobStats() {
	const res = await http.get<APIResponse<JobStatsDTO>>("/api/v1/jobs/stats");
	return res.data.data;
}

export async function createJob(data: CreateJobForm) {
	const res = await http.post<APIResponse<JobDTO>>("/api/v1/jobs", data);
	return res.data.data;
}

export async function getJobs(page = 1, limit = 10) {
	const res = await http.get<PaginatedResponse<JobListItemDTO>>("/api/v1/jobs", {
		params: { page, limit },
	});
	return res.data;
}

export async function getJobById(id: string) {
	const res = await http.get<APIResponse<JobDTO | null>>(`/api/v1/jobs/${id}`);
	return res.data.data;
}

export async function getJobNotes(jobId: string, page = 1, limit = 20) {
	const res = await http.get<PaginatedResponse<ClientNoteDTO>>(`/api/v1/jobs/${jobId}/notes`, {
		params: { page, limit },
	});
	return res.data;
}

export async function getJobInvoices(jobId: string, page = 1, limit = 10) {
	const res = await http.get<PaginatedResponse<JobInvoiceDTO>>(`/api/v1/jobs/${jobId}/invoices`, {
		params: { page, limit },
	});
	return res.data;
}

export async function updateJobLineItems(id: string, data: UpdateJobLineItemsForm) {
	const res = await http.put<APIResponse<JobDTO>>(`/api/v1/jobs/${id}/line-items`, data);
	return res.data.data;
}
