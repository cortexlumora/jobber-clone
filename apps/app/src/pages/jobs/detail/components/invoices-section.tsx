import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { getJobInvoices } from "../../api";
import { formatCurrency } from "@/lib/format";
import Section from "@/components/section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";

const PAGE_SIZE = 10;

const invoiceStatusColors: Record<string, string> = {
	draft: "bg-gray-100 text-gray-700",
	sent: "bg-blue-100 text-blue-700",
	paid: "bg-green-100 text-green-700",
	partial: "bg-amber-100 text-amber-700",
	overdue: "bg-red-100 text-red-700",
	void: "bg-muted text-muted-foreground",
};

interface InvoicesSectionProps {
	jobId: string;
}

const InvoicesSection = ({ jobId }: InvoicesSectionProps) => {
	const navigate = useNavigate();
	const [page, setPage] = useState(1);

	const { data: result } = useQuery({
		queryKey: ["job-invoices", jobId, page],
		queryFn: () => getJobInvoices(jobId, page),
		placeholderData: (p) => p,
		staleTime: 30_000,
	});

	const invoices = result?.data ?? [];
	const total = result?.pagination?.total ?? 0;
	const totalPages = Math.ceil(total / PAGE_SIZE);

	return (
		<Section
			title={`Invoices${total > 0 ? ` (${total})` : ""}`}
			action={
				<Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => navigate(`/invoices/create?jobId=${jobId}`)}>
					<Plus className="h-3 w-3 mr-1" />
					Create Invoice
				</Button>
			}
		>
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead className="text-xs">Invoice</TableHead>
						<TableHead className="text-xs">Due Date</TableHead>
						<TableHead className="text-xs">Status</TableHead>
						<TableHead className="text-xs">Subject</TableHead>
						<TableHead className="text-xs text-right">Balance</TableHead>
						<TableHead className="text-xs text-right">Total</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{invoices.length === 0 ? (
						<TableRow>
							<TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-6">
								No invoices yet
							</TableCell>
						</TableRow>
					) : (
						invoices.map((invoice) => (
							<TableRow key={invoice.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/invoices/${invoice.id}`)}>
								<TableCell className="text-sm font-medium">
									{invoice.invoiceNumber ? `#${invoice.invoiceNumber}` : "—"}
								</TableCell>
								<TableCell className="text-sm">{invoice.dueDate ?? "—"}</TableCell>
								<TableCell>
									<Badge variant="secondary" className={invoiceStatusColors[invoice.status] ?? ""}>
										{invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
									</Badge>
								</TableCell>
								<TableCell className="text-sm text-muted-foreground">{invoice.subject ?? "—"}</TableCell>
								<TableCell className="text-sm text-right font-medium">{formatCurrency(Number(invoice.balance))}</TableCell>
								<TableCell className="text-sm text-right font-medium">{formatCurrency(Number(invoice.total))}</TableCell>
							</TableRow>
						))
					)}
				</TableBody>
			</Table>
			{totalPages > 1 && (
				<div className="flex items-center justify-between px-4 py-3 border-t">
					<p className="text-xs text-muted-foreground">
						{(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}
					</p>
					<div className="flex items-center gap-1">
						<Button variant="ghost" size="icon" className="h-7 w-7" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
							<ChevronLeft className="h-4 w-4" />
						</Button>
						<Button variant="ghost" size="icon" className="h-7 w-7" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
							<ChevronRight className="h-4 w-4" />
						</Button>
					</div>
				</div>
			)}
		</Section>
	);
};

export default InvoicesSection;
