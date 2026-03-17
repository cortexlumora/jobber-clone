import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { getRequestById, updateRequestStatus, deleteRequest } from "./api";

export function useRequestQuery(id: string | null | undefined) {
	return useQuery({
		queryKey: ["request", id],
		queryFn: () => getRequestById(id!),
		enabled: !!id,
	});
}

export function useRequestStatusMutation(requestId: string) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (status: "new" | "assessed" | "converted" | "archived") =>
			updateRequestStatus(requestId, status),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["request", requestId] });
			queryClient.invalidateQueries({ queryKey: ["requests"] });
			queryClient.invalidateQueries({ queryKey: ["request-stats"] });
		},
	});
}

export function useDeleteRequestMutation(requestId: string) {
	const queryClient = useQueryClient();
	const navigate = useNavigate();

	return useMutation({
		mutationFn: () => deleteRequest(requestId),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["requests"] });
			queryClient.invalidateQueries({ queryKey: ["request-stats"] });
			navigate("/requests");
		},
	});
}
