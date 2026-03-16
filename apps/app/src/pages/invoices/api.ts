import type { APIResponse, InvoiceDTO, InvoiceListItemDTO, InvoiceStatsDTO, PaginatedResponse } from "@repo/dto";
import type { CreateInvoiceForm } from "@repo/zod/invoice";
import { http } from "@/lib/http";

export async function getInvoiceStats() {
	const res = await http.get<APIResponse<InvoiceStatsDTO>>("/api/v1/invoices/stats");
	return res.data.data;
}

export async function createInvoice(data: CreateInvoiceForm) {
	const res = await http.post<APIResponse<InvoiceDTO>>("/api/v1/invoices", data);
	return res.data.data;
}

export async function getInvoices(page = 1, limit = 10) {
	const res = await http.get<PaginatedResponse<InvoiceListItemDTO>>("/api/v1/invoices", {
		params: { page, limit },
	});
	return res.data;
}

export async function getInvoiceById(id: string) {
	const res = await http.get<APIResponse<InvoiceDTO | null>>(`/api/v1/invoices/${id}`);
	return res.data.data;
}
