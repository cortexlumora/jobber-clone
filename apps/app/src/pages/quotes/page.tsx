import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { getQuotes } from "./api";
import { getClients, getClientProperties } from "@/pages/clients/api";
import type { ClientDTO, QuoteDTO, PropertyDTO } from "@repo/dto";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Plus, Search, MoreHorizontal } from "lucide-react";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";

const statusColors: Record<string, string> = {
	draft: "bg-gray-100 text-gray-700",
	sent: "bg-blue-100 text-blue-700",
	approved: "bg-green-100 text-green-700",
	rejected: "bg-red-100 text-red-700",
	archived: "bg-muted text-muted-foreground",
};

function computeTotal(quote: QuoteDTO) {
	const subtotal = quote.lineItems
		.filter((i) => i.type === "line_item")
		.reduce((sum, item) => sum + item.qty * Number(item.unitPrice), 0);
	const discount = quote.discount ? Number(quote.discount) : 0;
	const tax = quote.tax ? Number(quote.tax) : 0;
	return subtotal - discount + tax;
}

const QuotesPage = () => {
	const navigate = useNavigate();
	const [statusFilter, setStatusFilter] = useState("all");
	const [salespersonFilter, setSalespersonFilter] = useState("all");
	const [search, setSearch] = useState("");

	const { data: quotes, isLoading, isError, error } = useQuery({
		queryKey: ["quotes"],
		queryFn: getQuotes,
	});
	const { data: clients } = useQuery({
		queryKey: ["clients"],
		queryFn: getClients,
	});

	const clientMap = useMemo(() => {
		if (!clients) return new Map<string, ClientDTO>();
		return new Map(clients.map((c) => [c.id, c]));
	}, [clients]);

	// Fetch properties for all clients that have quotes
	const clientIds = useMemo(() => {
		if (!quotes) return [];
		return [...new Set(quotes.map((q) => q.clientId))];
	}, [quotes]);

	const { data: propertiesMap } = useQuery({
		queryKey: ["quote-client-properties", clientIds],
		queryFn: async () => {
			const map = new Map<string, PropertyDTO[]>();
			await Promise.all(
				clientIds.map(async (clientId) => {
					const result = await getClientProperties(clientId, 1, 100);
					map.set(clientId, result.data);
				}),
			);
			return map;
		},
		enabled: clientIds.length > 0,
	});

	const getClientDisplayName = (clientId: string) => {
		const client = clientMap.get(clientId);
		if (!client) return "";
		const title = client.title !== "none" ? `${client.title} ` : "";
		const name = client.useCompanyAsPrimary && client.companyName
			? client.companyName
			: `${client.firstName} ${client.lastName}`;
		return `${title}${name}`;
	};

	const getPropertyAddress = (clientId: string) => {
		const props = propertiesMap?.get(clientId);
		if (!props || props.length === 0) return null;
		const p = props[0];
		const parts = [p.street1, p.street2, p.city, p.state, p.zip].filter(Boolean);
		return parts.join(", ");
	};

	// Stats
	const draftCount = quotes?.filter((q) => q.status === "draft").length ?? 0;
	const awaitingCount = quotes?.filter((q) => q.status === "sent").length ?? 0;
	const changesRequestedCount = 0;
	const approvedCount = quotes?.filter((q) => q.status === "approved").length ?? 0;

	const sentLast30 = useMemo(() => {
		if (!quotes) return { count: 0, total: 0 };
		const cutoff = new Date();
		cutoff.setDate(cutoff.getDate() - 30);
		const sent = quotes.filter((q) => q.status !== "draft" && new Date(q.createdAt) >= cutoff);
		return {
			count: sent.length,
			total: sent.reduce((sum, q) => sum + computeTotal(q), 0),
		};
	}, [quotes]);

	const convertedLast30 = useMemo(() => {
		if (!quotes) return { count: 0, total: 0 };
		const cutoff = new Date();
		cutoff.setDate(cutoff.getDate() - 30);
		const converted = quotes.filter((q) => q.status === "approved" && new Date(q.createdAt) >= cutoff);
		return {
			count: converted.length,
			total: converted.reduce((sum, q) => sum + computeTotal(q), 0),
		};
	}, [quotes]);

	const conversionRate = sentLast30.count > 0
		? Math.round((convertedLast30.count / sentLast30.count) * 100)
		: 0;

	// Salespersons for filter
	const salespersons = useMemo(() => {
		if (!quotes) return [];
		return [...new Set(quotes.map((q) => q.salesperson).filter(Boolean))] as string[];
	}, [quotes]);

	const filteredQuotes = useMemo(() => {
		if (!quotes) return [];
		let filtered = quotes;
		if (statusFilter !== "all") {
			filtered = filtered.filter((q) => q.status === statusFilter);
		}
		if (salespersonFilter !== "all") {
			filtered = filtered.filter((q) => q.salesperson === salespersonFilter);
		}
		if (search.trim()) {
			const q = search.toLowerCase();
			filtered = filtered.filter((quote) => {
				const clientName = getClientDisplayName(quote.clientId);
				return (
					quote.title.toLowerCase().includes(q) ||
					clientName.toLowerCase().includes(q) ||
					(quote.quoteNumber && quote.quoteNumber.toLowerCase().includes(q))
				);
			});
		}
		return filtered;
	}, [quotes, statusFilter, salespersonFilter, search, clientMap]);

	return (
		<div>
			{/* Header */}
			<div className="flex items-center justify-between mb-6">
				<h2 className="text-2xl font-semibold">Quotes</h2>
				<div className="flex items-center gap-2">
					<Button onClick={() => navigate("/quotes/create")}>
						<Plus className="h-4 w-4 mr-1" />
						New Quote
					</Button>
					<Button variant="outline" size="icon">
						<MoreHorizontal className="h-4 w-4" />
					</Button>
				</div>
			</div>

			{/* Stats Cards */}
			<div className="grid grid-cols-4 gap-4 mb-6">
				{/* Overview */}
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium text-muted-foreground">Overview</CardTitle>
					</CardHeader>
					<CardContent className="space-y-2">
						<div className="flex items-center justify-between text-sm">
							<span className="flex items-center gap-2">
								<span className="h-2.5 w-2.5 rounded-full bg-gray-400" />
								Draft
							</span>
							<span className="font-medium">{draftCount}</span>
						</div>
						<div className="flex items-center justify-between text-sm">
							<span className="flex items-center gap-2">
								<span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
								Awaiting response
							</span>
							<span className="font-medium">{awaitingCount}</span>
						</div>
						<div className="flex items-center justify-between text-sm">
							<span className="flex items-center gap-2">
								<span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
								Changes requested
							</span>
							<span className="font-medium">{changesRequestedCount}</span>
						</div>
						<div className="flex items-center justify-between text-sm">
							<span className="flex items-center gap-2">
								<span className="h-2.5 w-2.5 rounded-full bg-green-500" />
								Approved
							</span>
							<span className="font-medium">{approvedCount}</span>
						</div>
					</CardContent>
				</Card>

				{/* Conversion Rate */}
				<Card className="flex flex-col">
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium text-muted-foreground">Conversion rate</CardTitle>
						<p className="text-xs text-muted-foreground">Past 30 days</p>
					</CardHeader>
					<CardContent className="mt-auto">
						<div className="flex items-baseline gap-2">
							<span className="text-3xl font-semibold">{conversionRate}%</span>
							<span className="text-sm text-muted-foreground">0%</span>
						</div>
					</CardContent>
				</Card>

				{/* Sent */}
				<Card className="flex flex-col">
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium text-muted-foreground">Sent</CardTitle>
						<p className="text-xs text-muted-foreground">Past 30 days</p>
					</CardHeader>
					<CardContent className="mt-auto">
						<div className="flex items-baseline gap-3">
							<span className="text-3xl font-semibold">{sentLast30.count}</span>
							<span className="text-sm text-muted-foreground">0%</span>
							<span className="text-sm font-medium">${sentLast30.total.toFixed(0)}</span>
						</div>
					</CardContent>
				</Card>

				{/* Converted */}
				<Card className="flex flex-col">
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium text-muted-foreground">Converted</CardTitle>
						<p className="text-xs text-muted-foreground">Past 30 days</p>
					</CardHeader>
					<CardContent className="mt-auto">
						<div className="flex items-baseline gap-3">
							<span className="text-3xl font-semibold">{convertedLast30.count}</span>
							<span className="text-sm text-muted-foreground">0%</span>
							<span className="text-sm font-medium">${convertedLast30.total.toFixed(0)}</span>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Filter Bar */}
			<div className="flex items-center justify-between mb-4">
				<div className="flex items-center gap-2">
					<span className="text-sm font-medium">All quotes</span>
					<span className="text-sm text-muted-foreground">
						({filteredQuotes.length} result{filteredQuotes.length !== 1 ? "s" : ""})
					</span>
				</div>
				<div className="flex items-center gap-2">
					<Select value={statusFilter} onValueChange={setStatusFilter}>
						<SelectTrigger className="w-32 h-9">
							<SelectValue placeholder="Status" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All</SelectItem>
							<SelectItem value="draft">Draft</SelectItem>
							<SelectItem value="sent">Sent</SelectItem>
							<SelectItem value="approved">Approved</SelectItem>
							<SelectItem value="rejected">Rejected</SelectItem>
							<SelectItem value="archived">Archived</SelectItem>
						</SelectContent>
					</Select>
					{salespersons.length > 0 && (
						<Select value={salespersonFilter} onValueChange={setSalespersonFilter}>
							<SelectTrigger className="w-36 h-9">
								<SelectValue placeholder="Salesperson" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All</SelectItem>
								{salespersons.map((sp) => (
									<SelectItem key={sp} value={sp}>{sp}</SelectItem>
								))}
							</SelectContent>
						</Select>
					)}
					<div className="relative">
						<Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
						<Input
							placeholder="Search quotes..."
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
			{quotes && (
				<div className="rounded-lg border">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Client</TableHead>
								<TableHead>Quote number</TableHead>
								<TableHead>Property</TableHead>
								<TableHead>Created</TableHead>
								<TableHead>Status</TableHead>
								<TableHead className="text-right">Total</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{filteredQuotes.length === 0 && (
								<TableRow>
									<TableCell colSpan={6} className="text-center text-muted-foreground">
										No quotes found
									</TableCell>
								</TableRow>
							)}
							{filteredQuotes.map((quote) => {
								const clientName = getClientDisplayName(quote.clientId);
								const property = getPropertyAddress(quote.clientId);
								const total = computeTotal(quote);
								const created = new Date(quote.createdAt).toLocaleDateString("en-US", {
									month: "short",
									day: "numeric",
									year: "numeric",
								});

								return (
									<TableRow key={quote.id} className="cursor-pointer hover:bg-muted/50">
										<TableCell className="font-medium">
											{clientName}
										</TableCell>
										<TableCell className="text-sm">
											{quote.quoteNumber ? `#${quote.quoteNumber}` : "—"}
										</TableCell>
										<TableCell className="text-sm text-muted-foreground max-w-xs truncate">
											{property ?? "—"}
										</TableCell>
										<TableCell className="text-sm">
											{created}
										</TableCell>
										<TableCell>
											<Badge variant="secondary" className={statusColors[quote.status] ?? ""}>
												{quote.status === "sent" ? "Awaiting response" : quote.status.charAt(0).toUpperCase() + quote.status.slice(1)}
											</Badge>
										</TableCell>
										<TableCell className="text-right font-medium">
											${total.toFixed(2)}
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

export default QuotesPage;
