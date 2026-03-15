import type { APIResponse, ExpenseDTO } from "@repo/dto";
import type { CreateExpenseForm } from "@repo/zod/expense";
import { http } from "@/lib/http";

export async function createExpense(jobId: string, data: CreateExpenseForm) {
	const res = await http.post<APIResponse<ExpenseDTO>>(`/api/v1/jobs/${jobId}/expenses`, data);
	return res.data.data;
}

export async function deleteExpense(jobId: string, id: string) {
	const res = await http.delete<APIResponse<null>>(`/api/v1/jobs/${jobId}/expenses/${id}`);
	return res.data.data;
}
