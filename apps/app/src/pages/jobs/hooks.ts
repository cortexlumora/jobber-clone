import { useQuery } from "@tanstack/react-query";
import { getJobById } from "./api";

export function useJobQuery(id: string | null | undefined) {
	return useQuery({
		queryKey: ["job", id],
		queryFn: () => getJobById(id!),
		enabled: !!id,
	});
}
