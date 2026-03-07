import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { getClients, getClientStats, archiveClient, deleteClient } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, TrendingUp, TrendingDown, MoreHorizontal, Phone, Mail, Archive, Trash2, ExternalLink } from "lucide-react";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const ClientsPage = () => {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const { data: clients, isLoading, isError, error } = useQuery({
		queryKey: ["clients"],
		queryFn: getClients,
	});

	const { data: stats } = useQuery({
		queryKey: ["client-stats"],
		queryFn: getClientStats,
	});

	const archiveMutation = useMutation({
		mutationFn: archiveClient,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["clients"] });
			queryClient.invalidateQueries({ queryKey: ["client-stats"] });
		},
	});

	const deleteMutation = useMutation({
		mutationFn: deleteClient,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["clients"] });
			queryClient.invalidateQueries({ queryKey: ["client-stats"] });
		},
	});

	const renderChange = (change: number) => {
		if (change > 0) {
			return (
				<span className="text-xs text-green-600 flex items-center gap-1">
					<TrendingUp className="h-3 w-3" />
					{change}%
				</span>
			);
		}
		if (change < 0) {
			return (
				<span className="text-xs text-red-600 flex items-center gap-1">
					<TrendingDown className="h-3 w-3" />
					{change}%
				</span>
			);
		}
		return <span className="text-xs text-muted-foreground">0%</span>;
	};

	return (
		<div>
			<div className="flex items-center justify-between mb-4">
				<h2 className="text-2xl font-semibold">Clients</h2>
				<Button onClick={() => navigate("/clients/create")}>
					<Plus className="h-4 w-4 mr-1" />
					New Client
				</Button>
			</div>
			<div className="grid grid-cols-3 gap-4 mb-6">
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium text-muted-foreground">New leads</CardTitle>
						<p className="text-xs text-muted-foreground">Past 30 days</p>
					</CardHeader>
					<CardContent>
						<div className="flex items-center gap-2">
							<span className="text-2xl font-bold">{stats?.newLeads ?? 0}</span>
							{stats && renderChange(stats.newLeadsChange)}
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium text-muted-foreground">New clients</CardTitle>
						<p className="text-xs text-muted-foreground">Past 30 days</p>
					</CardHeader>
					<CardContent>
						<div className="flex items-center gap-2">
							<span className="text-2xl font-bold">{stats?.newClients ?? 0}</span>
							{stats && renderChange(stats.newClientsChange)}
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium text-muted-foreground">Total new clients</CardTitle>
						<p className="text-xs text-muted-foreground">Year to date</p>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{stats?.totalNewClients ?? 0}</div>
					</CardContent>
				</Card>
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
								<TableHead className="w-10"></TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{clients.length === 0 && (
								<TableRow>
									<TableCell colSpan={5} className="text-center text-muted-foreground">
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
									<TableCell>
										<DropdownMenu>
											<DropdownMenuTrigger asChild>
												<Button variant="ghost" size="icon" className="h-8 w-8">
													<MoreHorizontal className="h-4 w-4" />
												</Button>
											</DropdownMenuTrigger>
											<DropdownMenuContent align="end">
												{client.phones[0]?.number && (
													<DropdownMenuItem asChild>
														<a href={`tel:${client.phones[0].number}`}>
															<Phone className="h-4 w-4 mr-2" />
															Call
														</a>
													</DropdownMenuItem>
												)}
												{client.emails[0]?.value && (
													<DropdownMenuItem asChild>
														<a href={`mailto:${client.emails[0].value}`}>
															<Mail className="h-4 w-4 mr-2" />
															Email
														</a>
													</DropdownMenuItem>
												)}
												<DropdownMenuItem onClick={() => archiveMutation.mutate(client.id)}>
													<Archive className="h-4 w-4 mr-2" />
													Archive
												</DropdownMenuItem>
												<DropdownMenuItem
													className="text-destructive"
													onClick={() => deleteMutation.mutate(client.id)}
												>
													<Trash2 className="h-4 w-4 mr-2" />
													Delete
												</DropdownMenuItem>
												<DropdownMenuItem onClick={() => window.open(`/clients/${client.id}`, "_blank")}>
													<ExternalLink className="h-4 w-4 mr-2" />
													Open in new tab
												</DropdownMenuItem>
											</DropdownMenuContent>
										</DropdownMenu>
									</TableCell>
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
