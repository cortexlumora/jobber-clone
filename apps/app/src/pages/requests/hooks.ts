import { useQuery } from "@tanstack/react-query";
import { getRequestById } from "./api";

export function useRequestQuery(id: string | null | undefined) {
	return useQuery({
		queryKey: ["request", id],
		queryFn: () => getRequestById(id!),
		enabled: !!id,
	});
}
