import type { APIResponse, ExpenseDTO, PaginatedResponse } from "@repo/dto";
import type { CreateExpenseForm } from "@repo/zod/expense";
import { http } from "@/lib/http";

export async function createExpense(jobId: string, data: CreateExpenseForm) {
	const res = await http.post<APIResponse<ExpenseDTO>>(`/api/v1/jobs/${jobId}/expenses`, data);
	return res.data.data;
}

export async function getExpenses(jobId: string, page = 1, limit = 10) {
	const res = await http.get<PaginatedResponse<ExpenseDTO>>(`/api/v1/jobs/${jobId}/expenses`, {
		params: { page, limit },
	});
	return res.data;
}

export async function updateExpense(jobId: string, id: string, data: CreateExpenseForm) {
	const res = await http.put<APIResponse<ExpenseDTO>>(`/api/v1/jobs/${jobId}/expenses/${id}`, data);
	return res.data.data;
}

export async function deleteExpense(jobId: string, id: string) {
	const res = await http.delete<APIResponse<null>>(`/api/v1/jobs/${jobId}/expenses/${id}`);
	return res.data.data;
}
