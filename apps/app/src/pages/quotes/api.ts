import type { APIResponse, QuoteDTO, QuoteListItemDTO, QuoteStatsDTO, ClientNoteDTO, EmailLogDTO, PaginatedResponse } from "@repo/dto";
import type { CreateQuoteForm, UpdateQuoteLineItemsForm } from "@repo/zod/quote";
import { http } from "@/lib/http";

export async function getQuoteStats() {
	const res = await http.get<APIResponse<QuoteStatsDTO>>("/api/v1/quotes/stats");
	return res.data.data;
}

export async function createQuote(data: CreateQuoteForm) {
	const res = await http.post<APIResponse<QuoteDTO>>("/api/v1/quotes", data);
	return res.data.data;
}

export async function getQuotes(page = 1, limit = 10) {
	const res = await http.get<PaginatedResponse<QuoteListItemDTO>>("/api/v1/quotes", {
		params: { page, limit },
	});
	return res.data;
}

export async function getQuoteById(id: string) {
	const res = await http.get<APIResponse<QuoteDTO | null>>(`/api/v1/quotes/${id}`);
	return res.data.data;
}

export async function getQuoteNotes(quoteId: string, page = 1, limit = 20) {
	const res = await http.get<PaginatedResponse<ClientNoteDTO>>(`/api/v1/quotes/${quoteId}/notes`, {
		params: { page, limit },
	});
	return res.data;
}

export async function updateQuoteLineItems(id: string, data: UpdateQuoteLineItemsForm) {
	const res = await http.put<APIResponse<QuoteDTO>>(`/api/v1/quotes/${id}/line-items`, data);
	return res.data.data;
}

export async function sendQuoteEmail(quoteId: string, data: { to: string; subject: string; message: string; sendCopyToSelf?: boolean }) {
	const res = await http.post<APIResponse<EmailLogDTO>>(`/api/v1/quotes/${quoteId}/send-email`, data);
	return res.data.data;
}
