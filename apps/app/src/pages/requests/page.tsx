import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { getRequests } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";

const RequestsPage = () => {
	const navigate = useNavigate();
	const { data: requests, isLoading, isError, error } = useQuery({
		queryKey: ["requests"],
		queryFn: getRequests,
	});

	return (
		<div>
			<div className="flex items-center justify-between mb-4">
				<h2 className="text-2xl font-semibold">Requests</h2>
				<Button onClick={() => navigate("/requests/create")}>
					<Plus className="h-4 w-4 mr-1" />
					New Request
				</Button>
			</div>
			{isLoading && <p className="text-muted-foreground">Loading...</p>}
			{isError && <p className="text-sm text-destructive">{error.message}</p>}
			{requests && (
				<div className="rounded-lg border">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Service</TableHead>
								<TableHead>Best Day</TableHead>
								<TableHead>Arrival</TableHead>
								<TableHead>Status</TableHead>
								<TableHead>Assessment</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{requests.length === 0 && (
								<TableRow>
									<TableCell colSpan={5} className="text-center text-muted-foreground">
										No requests yet
									</TableCell>
								</TableRow>
							)}
							{requests.map((request) => (
								<TableRow key={request.id}>
									<TableCell className="font-medium max-w-xs truncate">
										{request.serviceDescription}
									</TableCell>
									<TableCell>{request.bestDay}</TableCell>
									<TableCell className="capitalize">{request.preferredArrival}</TableCell>
									<TableCell className="capitalize">{request.status}</TableCell>
									<TableCell>{request.assessmentRequired ? "Yes" : "No"}</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>
			)}
		</div>
	);
};

export default RequestsPage;
