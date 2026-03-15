import type { APIResponse, InvoiceDTO } from "@repo/dto";
import type { CreateInvoiceForm } from "@repo/zod/invoice";
import { http } from "@/lib/http";

export async function createInvoice(data: CreateInvoiceForm) {
	const res = await http.post<APIResponse<InvoiceDTO>>("/api/v1/invoices", data);
	return res.data.data;
}

export async function getInvoices() {
	const res = await http.get<APIResponse<InvoiceDTO[]>>("/api/v1/invoices");
	return res.data.data;
}

export async function getInvoiceById(id: string) {
	const res = await http.get<APIResponse<InvoiceDTO | null>>(`/api/v1/invoices/${id}`);
	return res.data.data;
}
