import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { getJobById, updateJobStatus, deleteJob } from "./api";

export function useJobQuery(id: string | null | undefined) {
	return useQuery({
		queryKey: ["job", id],
		queryFn: () => getJobById(id!),
		enabled: !!id,
	});
}

export function useJobStatusMutation(jobId: string) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (status: "draft" | "active" | "action_required" | "complete" | "archived") =>
			updateJobStatus(jobId, status),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["job", jobId] });
			queryClient.invalidateQueries({ queryKey: ["jobs"] });
			queryClient.invalidateQueries({ queryKey: ["job-stats"] });
		},
	});
}

export function useDeleteJobMutation(jobId: string) {
	const queryClient = useQueryClient();
	const navigate = useNavigate();

	return useMutation({
		mutationFn: () => deleteJob(jobId),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["jobs"] });
			queryClient.invalidateQueries({ queryKey: ["job-stats"] });
			navigate("/jobs");
		},
	});
}
