import { useQuery } from "@tanstack/react-query";
import { getClientById } from "./api";

export function useClientQuery(id: string | null | undefined) {
	return useQuery({
		queryKey: ["client", id],
		queryFn: () => getClientById(id!),
		enabled: !!id,
	});
}
