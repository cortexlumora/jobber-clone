import { useQuery } from "@tanstack/react-query";
import { getQuoteById } from "./api";

export function useQuoteQuery(id: string | null | undefined) {
	return useQuery({
		queryKey: ["quote", id],
		queryFn: () => getQuoteById(id!),
		enabled: !!id,
	});
}
