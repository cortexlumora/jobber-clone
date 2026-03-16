import { useQuery } from "@tanstack/react-query";
import { getInvoiceById } from "./api";

export function useInvoiceQuery(id: string | null | undefined) {
	return useQuery({
		queryKey: ["invoice", id],
		queryFn: () => getInvoiceById(id!),
		enabled: !!id,
	});
}
