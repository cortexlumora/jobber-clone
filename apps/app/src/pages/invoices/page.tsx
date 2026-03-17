import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { usePagination } from "@repo/common";
import { getInvoices, getInvoiceStats } from "./api";
import type { InvoiceListItemDTO } from "@repo/dto";
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
import { Plus, Search, MoreHorizontal, ChevronLeft, ChevronRight } from "lucide-react";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/format";

const statusColors: Record<string, string> = {
	draft: "bg-gray-100 text-gray-700",
	sent: "bg-blue-100 text-blue-700",
	paid: "bg-green-100 text-green-700",
	partial: "bg-amber-100 text-amber-700",
	overdue: "bg-red-100 text-red-700",
	void: "bg-muted text-muted-foreground",
};

const statusLabels: Record<string, string> = {
	draft: "Draft",
	sent: "Sent",
	paid: "Paid",
	partial: "Partial",
	overdue: "Overdue",
	void: "Void",
};

const InvoicesPage = () => {
	const navigate = useNavigate();
	const { page, setPage, perPage, search, setSearch } = usePagination({ perPage: 10 });
	const [statusFilter, setStatusFilter] = useState("all");

	const { data: result, isLoading, isError, error } = useQuery({
		queryKey: ["invoices", page, perPage, statusFilter, search],
		queryFn: () => getInvoices(page, perPage),
	});

	const invoices = result?.data ?? [];
	const total = result?.pagination?.total ?? 0;
	const totalPages = result?.pagination?.totalPages ?? 0;

	const getClientDisplayName = (invoice: InvoiceListItemDTO) => {
		const client = invoice.client;
		if (!client) return "";
		const title = client.title !== "none" ? `${client.title} ` : "";
		const name = client.useCompanyAsPrimary && client.companyName
			? client.companyName
			: `${client.firstName} ${client.lastName}`;
		return `${title}${name}`;
	};

	const { data: stats } = useQuery({
		queryKey: ["invoice-stats"],
		queryFn: getInvoiceStats,
	});

	const pastDue = { count: stats?.pastDueCount ?? 0, amount: stats?.pastDueAmount ?? 0 };
	const sentNotDue = { count: stats?.sentCount ?? 0, amount: stats?.sentAmount ?? 0 };
	const drafts = { count: stats?.draftCount ?? 0, amount: stats?.draftAmount ?? 0 };
	const past30Stats = { issued: stats?.issuedLast30 ?? 0, issuedChange: stats?.issuedLast30Change ?? 0, avgInvoice: stats?.avgInvoiceLast30 ?? 0 };

	const filteredInvoices = useMemo(() => {
		let filtered = invoices;
		if (statusFilter !== "all") {
			filtered = filtered.filter((i) => i.status === statusFilter);
		}
		if (search.trim()) {
			const q = search.toLowerCase();
			filtered = filtered.filter((invoice) => {
				const clientName = getClientDisplayName(invoice);
				return (
					clientName.toLowerCase().includes(q) ||
					(invoice.invoiceNumber && invoice.invoiceNumber.toLowerCase().includes(q)) ||
					(invoice.subject && invoice.subject.toLowerCase().includes(q))
				);
			});
		}
		return filtered;
	}, [invoices, statusFilter, search]);

	return (
		<div>
			{/* Header */}
			<div className="flex items-center justify-between mb-6">
				<h2 className="text-2xl font-semibold">Invoices</h2>
				<div className="flex items-center gap-2">
					<Button onClick={() => navigate("/invoices/clients/select")}>
						<Plus className="h-4 w-4 mr-1" />
						New Invoice
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
								<span className="h-2.5 w-2.5 rounded-full bg-red-500" />
								Past due ({pastDue.count})
							</span>
							<span className="font-medium">{formatCurrency(pastDue.amount)}</span>
						</div>
						<div className="flex items-center justify-between text-sm">
							<span className="flex items-center gap-2">
								<span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
								Sent but not due ({sentNotDue.count})
							</span>
							<span className="font-medium">{formatCurrency(sentNotDue.amount)}</span>
						</div>
						<div className="flex items-center justify-between text-sm">
							<span className="flex items-center gap-2">
								<span className="h-2.5 w-2.5 rounded-full bg-gray-400" />
								Draft ({drafts.count})
							</span>
							<span className="font-medium">{formatCurrency(drafts.amount)}</span>
						</div>
					</CardContent>
				</Card>

				{/* Issued */}
				<Card className="flex flex-col">
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium text-muted-foreground">Issued</CardTitle>
						<p className="text-xs text-muted-foreground">Past 30 days</p>
					</CardHeader>
					<CardContent className="mt-auto">
						<div className="flex items-baseline gap-3">
							<span className="text-3xl font-semibold">{past30Stats.issued}</span>
							<span className="text-sm text-muted-foreground">0%</span>
							<span className="text-sm font-medium">{formatCurrency(past30Stats.issued > 0 ? past30Stats.issued * past30Stats.avgInvoice : 0)}</span>
						</div>
					</CardContent>
				</Card>

				{/* Average invoice */}
				<Card className="flex flex-col">
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium text-muted-foreground">Average invoice</CardTitle>
						<p className="text-xs text-muted-foreground">Past 30 days</p>
					</CardHeader>
					<CardContent className="mt-auto">
						<div className="flex items-baseline gap-3">
							<span className="text-3xl font-semibold">{formatCurrency(past30Stats.avgInvoice)}</span>
							<span className="text-sm text-muted-foreground">0%</span>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Filter Bar */}
			<div className="flex items-center justify-between mb-4">
				<div className="flex items-center gap-2">
					<span className="text-sm font-medium">All invoices</span>
					<span className="text-sm text-muted-foreground">
						({filteredInvoices.length} result{filteredInvoices.length !== 1 ? "s" : ""})
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
							<SelectItem value="paid">Paid</SelectItem>
							<SelectItem value="partial">Partial</SelectItem>
							<SelectItem value="overdue">Overdue</SelectItem>
							<SelectItem value="void">Void</SelectItem>
						</SelectContent>
					</Select>
					<div className="relative">
						<Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
						<Input
							placeholder="Search invoices..."
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
			{invoices && (
				<div className="rounded-lg border">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Client</TableHead>
								<TableHead>Invoice number</TableHead>
								<TableHead>Due date</TableHead>
								<TableHead>Subject</TableHead>
								<TableHead>Status</TableHead>
								<TableHead className="text-right">Total</TableHead>
								<TableHead className="text-right">Balance</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{filteredInvoices.length === 0 && (
								<TableRow>
									<TableCell colSpan={7} className="text-center text-muted-foreground">
										No invoices found
									</TableCell>
								</TableRow>
							)}
							{filteredInvoices.map((invoice) => {
								const clientName = getClientDisplayName(invoice);

								return (
									<TableRow key={invoice.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/invoices/${invoice.id}`)}>
										<TableCell className="font-medium">{clientName}</TableCell>
										<TableCell className="text-sm">
											{invoice.invoiceNumber ? `#${invoice.invoiceNumber}` : "—"}
										</TableCell>
										<TableCell className="text-sm">
											{invoice.dueDate ? `Net 30 days` : "—"}
										</TableCell>
										<TableCell className="text-sm text-muted-foreground">
											{invoice.subject ?? "—"}
										</TableCell>
										<TableCell>
											<Badge variant="secondary" className={statusColors[invoice.status] ?? ""}>
												{statusLabels[invoice.status] ?? invoice.status}
											</Badge>
										</TableCell>
										<TableCell className="text-right font-medium">
											{formatCurrency(Number(invoice.total))}
										</TableCell>
										<TableCell className="text-right font-medium">
											{formatCurrency(Number(invoice.balance))}
										</TableCell>
									</TableRow>
								);
							})}
						</TableBody>
					</Table>
					{totalPages > 1 && (
						<div className="flex items-center justify-between px-4 py-3 border-t">
							<p className="text-xs text-muted-foreground">
								{(page - 1) * perPage + 1}–{Math.min(page * perPage, total)} of {total}
							</p>
							<div className="flex items-center gap-1">
								<Button variant="ghost" size="icon" className="h-7 w-7" disabled={page <= 1} onClick={() => setPage(page - 1)}>
									<ChevronLeft className="h-4 w-4" />
								</Button>
								<Button variant="ghost" size="icon" className="h-7 w-7" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
									<ChevronRight className="h-4 w-4" />
								</Button>
							</div>
						</div>
					)}
				</div>
			)}
		</div>
	);
};

export default InvoicesPage;
