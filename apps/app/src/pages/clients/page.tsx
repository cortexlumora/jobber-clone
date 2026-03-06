import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { getClients } from "@/lib/api";
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

const ClientsPage = () => {
	const navigate = useNavigate();
	const { data: clients, isLoading, isError, error } = useQuery({
		queryKey: ["clients"],
		queryFn: getClients,
	});

	return (
		<div>
			<div className="flex items-center justify-between mb-4">
				<h2 className="text-2xl font-semibold">Clients</h2>
				<Button onClick={() => navigate("/clients/create")}>
					<Plus className="h-4 w-4 mr-1" />
					New Client
				</Button>
			</div>
			{isLoading && <p className="text-muted-foreground">Loading...</p>}
			{isError && <p className="text-sm text-destructive">{error.message}</p>}
			{clients && (
				<div className="rounded-lg border">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Name</TableHead>
								<TableHead>Company</TableHead>
								<TableHead>Email</TableHead>
								<TableHead>Phone</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{clients.length === 0 && (
								<TableRow>
									<TableCell colSpan={4} className="text-center text-muted-foreground">
										No clients yet
									</TableCell>
								</TableRow>
							)}
							{clients.map((client) => (
								<TableRow key={client.id}>
									<TableCell className="font-medium">
										{client.title !== "none" ? `${client.title} ` : ""}
										{client.firstName} {client.lastName}
									</TableCell>
									<TableCell>{client.companyName ?? "—"}</TableCell>
									<TableCell>{client.emails[0]?.value ?? "—"}</TableCell>
									<TableCell>{client.phones[0]?.number ?? "—"}</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>
			)}
		</div>
	);
};

export default ClientsPage;
