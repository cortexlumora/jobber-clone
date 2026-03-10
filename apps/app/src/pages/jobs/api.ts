import type { APIResponse, JobDTO } from "@repo/dto";
import type { CreateJobForm } from "@repo/zod/job";
import { http } from "@/lib/http";

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
