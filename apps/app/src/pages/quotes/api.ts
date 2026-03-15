import type { APIResponse, QuoteDTO } from "@repo/dto";
import type { CreateQuoteForm, UpdateQuoteLineItemsForm } from "@repo/zod/quote";
import { http } from "@/lib/http";

export async function createQuote(data: CreateQuoteForm) {
	const res = await http.post<APIResponse<QuoteDTO>>("/api/v1/quotes", data);
	return res.data.data;
}

export async function getQuotes() {
	const res = await http.get<APIResponse<QuoteDTO[]>>("/api/v1/quotes");
	return res.data.data;
}

export async function getQuoteById(id: string) {
	const res = await http.get<APIResponse<QuoteDTO | null>>(`/api/v1/quotes/${id}`);
	return res.data.data;
}

export async function updateQuoteLineItems(id: string, data: UpdateQuoteLineItemsForm) {
	const res = await http.put<APIResponse<QuoteDTO>>(`/api/v1/quotes/${id}/line-items`, data);
	return res.data.data;
}
