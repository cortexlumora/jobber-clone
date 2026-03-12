import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { getRequests } from "./api";
import { getClients } from "@/pages/clients/api";
import type { ClientDTO } from "@repo/dto";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Plus, ArrowUp, Search, MoreHorizontal } from "lucide-react";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";

function formatRelativeTime(date: Date) {
	const now = new Date();
	const d = new Date(date);
	const diffMs = now.getTime() - d.getTime();
	const diffMin = Math.floor(diffMs / 60000);
	const diffHours = Math.floor(diffMs / 3600000);
	const diffDays = Math.floor(diffMs / 86400000);

	let relative: string;
	if (diffMin < 1) relative = "Just now";
	else if (diffMin < 60) relative = `${diffMin} minute${diffMin === 1 ? "" : "s"} ago`;
	else if (diffHours < 24) relative = `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
	else if (diffDays < 7) relative = `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
	else relative = d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

	const today = new Date();
	const yesterday = new Date(today);
	yesterday.setDate(yesterday.getDate() - 1);

	let label: string;
	if (d.toDateString() === today.toDateString()) label = "Today";
	else if (d.toDateString() === yesterday.toDateString()) label = "Yesterday";
	else label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

	return { relative, label };
}

const RequestsPage = () => {
	const navigate = useNavigate();
	const [statusFilter, setStatusFilter] = useState("all");
	const [search, setSearch] = useState("");

	const { data: requests, isLoading, isError, error } = useQuery({
		queryKey: ["requests"],
		queryFn: getRequests,
	});
	const { data: clients } = useQuery({
		queryKey: ["clients"],
		queryFn: getClients,
	});

	const clientMap = useMemo(() => {
		if (!clients) return new Map<string, ClientDTO>();
		return new Map(clients.map((c) => [c.id, c]));
	}, [clients]);

	const getClientDisplayName = (clientId: string) => {
		const client = clientMap.get(clientId);
		if (!client) return { title: "", name: "" };
		const title = client.title !== "none" ? client.title : "";
		const name = client.useCompanyAsPrimary && client.companyName
			? client.companyName
			: `${client.firstName} ${client.lastName}`;
		return { title, name };
	};

	const getClientContact = (clientId: string) => {
		const client = clientMap.get(clientId);
		if (!client) return { phone: null, email: null };
		return {
			phone: client.phones?.[0]?.number ?? null,
			email: client.emails?.[0]?.value ?? null,
		};
	};

	const newCount = requests?.filter((r) => r.status === "new").length ?? 0;
	const assessedCount = requests?.filter((r) => r.status === "assessed").length ?? 0;

	const filteredRequests = useMemo(() => {
		if (!requests) return [];
		let filtered = requests;
		if (statusFilter !== "all") {
			filtered = filtered.filter((r) => r.status === statusFilter);
		}
		if (search.trim()) {
			const q = search.toLowerCase();
			filtered = filtered.filter((r) => {
				const { name } = getClientDisplayName(r.clientId);
				return (
					r.title.toLowerCase().includes(q) ||
					name.toLowerCase().includes(q)
				);
			});
		}
		return filtered;
	}, [requests, statusFilter, search, clientMap]);

	return (
		<div>
			{/* Header */}
			<div className="flex items-center justify-between mb-6">
				<h2 className="text-2xl font-semibold">Requests</h2>
				<div className="flex items-center gap-2">
					<Button onClick={() => navigate("/requests/create")}>
						<Plus className="h-4 w-4 mr-1" />
						New Request
					</Button>
					<Button variant="outline" size="icon">
						<MoreHorizontal className="h-4 w-4" />
					</Button>
				</div>
			</div>

			{/* Stats Cards */}
			<div className="grid grid-cols-3 gap-4 mb-6">
				{/* Overview */}
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium text-muted-foreground">Overview</CardTitle>
					</CardHeader>
					<CardContent className="space-y-2">
						<div className="flex items-center justify-between text-sm">
							<span className="flex items-center gap-2">
								<span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
								New
							</span>
							<span className="font-medium">{newCount}</span>
						</div>
						<div className="flex items-center justify-between text-sm">
							<span className="flex items-center gap-2">
								<span className="h-2.5 w-2.5 rounded-full bg-green-500" />
								Assessment complete
							</span>
							<span className="font-medium">{assessedCount}</span>
						</div>
						<div className="flex items-center justify-between text-sm">
							<span className="flex items-center gap-2">
								<span className="h-2.5 w-2.5 rounded-full bg-red-500" />
								Overdue
							</span>
							<span className="font-medium">0</span>
						</div>
						<div className="flex items-center justify-between text-sm">
							<span className="flex items-center gap-2">
								<span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
								Unscheduled
							</span>
							<span className="font-medium">0</span>
						</div>
					</CardContent>
				</Card>

				{/* New Requests */}
				<Card className="flex flex-col">
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium text-muted-foreground">New requests</CardTitle>
						<p className="text-xs text-muted-foreground">Past 30 days</p>
					</CardHeader>
					<CardContent className="mt-auto">
						<div className="flex items-baseline gap-2">
							<span className="text-3xl font-semibold">{newCount}</span>
							{newCount > 0 && (
								<span className="flex items-center text-sm text-green-600 font-medium">
									<ArrowUp className="h-3 w-3 mr-0.5" />
									100%
								</span>
							)}
						</div>
					</CardContent>
				</Card>

				{/* Conversion Rate */}
				<Card className="flex flex-col">
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium text-muted-foreground">Conversion rate</CardTitle>
						<p className="text-xs text-muted-foreground">Quotes or jobs created from requests in the past 30 days</p>
					</CardHeader>
					<CardContent className="mt-auto">
						<div className="flex items-baseline gap-2">
							<span className="text-3xl font-semibold">0%</span>
							<span className="text-sm text-muted-foreground">0%</span>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Filter Bar */}
			<div className="flex items-center justify-between mb-4">
				<div className="flex items-center gap-2">
					<span className="text-sm font-medium">All requests</span>
					<span className="text-sm text-muted-foreground">
						({filteredRequests.length} result{filteredRequests.length !== 1 ? "s" : ""})
					</span>
				</div>
				<div className="flex items-center gap-2">
					<Select value={statusFilter} onValueChange={setStatusFilter}>
						<SelectTrigger className="w-32 h-9">
							<SelectValue placeholder="Status" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All</SelectItem>
							<SelectItem value="new">New</SelectItem>
							<SelectItem value="assessed">Assessed</SelectItem>
							<SelectItem value="converted">Converted</SelectItem>
							<SelectItem value="archived">Archived</SelectItem>
						</SelectContent>
					</Select>
					<div className="relative">
						<Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
						<Input
							placeholder="Search requests..."
							className="pl-8 h-9 w-56"
							value={search}
							onChange={(e) => setSearch(e.target.value)}
						/>
					</div>
				</div>
			</div>

			{/* Table */}
			{isLoading && <p className="text-muted-foreground">Loading...</p>}
			{isError && <p className="text-sm text-destructive">{error.message}</p>}
			{requests && (
				<div className="rounded-lg border">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Client</TableHead>
								<TableHead>Title</TableHead>
								<TableHead>Property</TableHead>
								<TableHead>Contact</TableHead>
								<TableHead>Requested</TableHead>
								<TableHead>Status</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{filteredRequests.length === 0 && (
								<TableRow>
									<TableCell colSpan={6} className="text-center text-muted-foreground">
										No requests found
									</TableCell>
								</TableRow>
							)}
							{filteredRequests.map((request) => {
								const { title: clientTitle, name: clientName } = getClientDisplayName(request.clientId);
								const contact = getClientContact(request.clientId);
								const time = formatRelativeTime(request.createdAt);

								return (
									<TableRow key={request.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/requests/${request.id}`)}>
										<TableCell className="font-medium">
											{clientTitle && <span className="text-muted-foreground">{clientTitle} </span>}
											{clientName}
										</TableCell>
										<TableCell className="max-w-xs truncate">
											{request.title}
										</TableCell>
										<TableCell className="text-sm text-muted-foreground">—</TableCell>
										<TableCell className="text-sm">
											{contact.phone && <div>{contact.phone}</div>}
											{contact.email && <div className="text-muted-foreground">{contact.email}</div>}
											{!contact.phone && !contact.email && "—"}
										</TableCell>
										<TableCell className="text-sm">
											<div>{time.relative}</div>
											<div className="text-muted-foreground">{time.label}</div>
										</TableCell>
										<TableCell>
											<span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize bg-muted">
												{request.status}
											</span>
										</TableCell>
									</TableRow>
								);
							})}
						</TableBody>
					</Table>
				</div>
			)}
		</div>
	);
};

export default RequestsPage;
