import { useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { getInvoiceById } from "../api";
import { getClientById, getClientProperties } from "@/pages/clients/api";
import { formatCurrency } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Phone, Mail, Link2 } from "lucide-react";

const statusConfig: Record<string, { label: string; className: string }> = {
	draft: { label: "Draft", className: "bg-green-100 text-green-800" },
	sent: { label: "Sent", className: "bg-blue-100 text-blue-800" },
	paid: { label: "Paid", className: "bg-green-100 text-green-800" },
	partial: { label: "Partial", className: "bg-amber-100 text-amber-800" },
	overdue: { label: "Overdue", className: "bg-red-100 text-red-800" },
	void: { label: "Void", className: "bg-gray-100 text-gray-800" },
};

const dueDateLabels: Record<string, string> = {
	upon_receipt: "Upon Receipt",
	net_15: "Net 15 days",
	net_30: "Net 30 days",
	net_45: "Net 45 days",
	net_60: "Net 60 days",
};

const InvoiceDetailPage = () => {
	const { id } = useParams<{ id: string }>();

	const { data: invoice, isLoading } = useQuery({
		queryKey: ["invoice", id],
		queryFn: () => getInvoiceById(id!),
		enabled: !!id,
	});

	const { data: client } = useQuery({
		queryKey: ["client", invoice?.clientId],
		queryFn: () => getClientById(invoice!.clientId),
		enabled: !!invoice?.clientId,
	});

	const { data: propertiesResult } = useQuery({
		queryKey: ["client-properties", invoice?.clientId],
		queryFn: () => getClientProperties(invoice!.clientId, 1, 10),
		enabled: !!invoice?.clientId,
	});

	if (isLoading) return <p className="text-muted-foreground p-4">Loading...</p>;
	if (!invoice) return <p className="text-muted-foreground p-4">Invoice not found</p>;

	const status = statusConfig[invoice.status] ?? statusConfig.draft;

	const clientDisplayName = client
		? `${client.title !== "none" ? `${client.title} ` : ""}${client.firstName} ${client.lastName}`
		: "";

	const property = propertiesResult?.data?.[0];
	const billingAddress = property
		? [property.street1, property.street2, property.city, [property.state, property.zip].filter(Boolean).join(" ")].filter(Boolean).join(", ")
		: null;

	const phone = client?.phones?.[0]?.number;
	const email = client?.emails?.[0]?.value;

	const subtotal = invoice.lineItems.reduce((sum, item) => sum + item.qty * Number(item.unitPrice), 0);
	const total = Number(invoice.total);
	const balance = Number(invoice.balance);

	return (
		<div className="max-w-5xl mx-auto">
			{/* Invoice Card */}
			<div className="rounded-lg border bg-background">
				{/* Header */}
				<div className="p-6 pb-0">
					{/* Status + Invoice Number */}
					<div className="flex items-center justify-between mb-4">
						<div className="flex items-center gap-3">
							<div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center text-primary text-sm font-bold">$</div>
							<Badge className={status.className}>{status.label}</Badge>
						</div>
						<span className="text-sm font-medium">Invoice #{invoice.invoiceNumber ?? "—"}</span>
					</div>

					{/* Client Name + Link */}
					<div className="flex items-center gap-2 mb-1">
						<h2 className="text-2xl font-semibold">{clientDisplayName}</h2>
						<Link2 className="h-4 w-4 text-primary" />
					</div>

					{/* Subject */}
					{invoice.subject && (
						<p className="text-sm text-muted-foreground mb-5">{invoice.subject}</p>
					)}

					{/* Two-column: Client Info | Invoice Details */}
					<div className="grid grid-cols-[1fr_1fr] gap-8 pb-6">
						{/* Left — Client Info */}
						<div className="flex flex-wrap gap-6">
							<div>
								<p className="text-sm font-semibold mb-1">Billing address</p>
								<p className="text-sm text-muted-foreground">{billingAddress ?? "—"}</p>
							</div>
							<div>
								<p className="text-sm font-semibold mb-1">Property Address</p>
								<p className="text-sm text-muted-foreground">(Same as billing address)</p>
							</div>
							<div>
								<p className="text-sm font-semibold mb-1">Contact details</p>
								<div className="space-y-0.5">
									{phone && (
										<div className="flex items-center gap-1.5 text-sm">
											<Phone className="h-3 w-3 shrink-0 text-muted-foreground" />
											<span>{phone}</span>
										</div>
									)}
									{email && (
										<div className="flex items-center gap-1.5 text-sm text-primary">
											<Mail className="h-3 w-3 shrink-0 text-muted-foreground" />
											<span>{email}</span>
										</div>
									)}
								</div>
							</div>
						</div>

						{/* Right — Invoice Details */}
						<div className="rounded-lg border">
							<div className="px-4 py-3 border-b">
								<p className="text-sm font-semibold">Invoice details</p>
							</div>
							<div className="divide-y">
								{invoice.jobId && (
									<div className="flex justify-between px-4 py-2.5 text-sm">
										<span>1 Job</span>
										<span className="text-primary">#{invoice.invoiceNumber}</span>
									</div>
								)}
								<div className="flex justify-between px-4 py-2.5 text-sm">
									<span>Issued</span>
									<span>{invoice.issuedDate ?? "Not sent yet"}</span>
								</div>
								<div className="flex justify-between px-4 py-2.5 text-sm">
									<span>Due</span>
									<span>{invoice.dueDate ? (dueDateLabels[invoice.dueDate] ?? invoice.dueDate) : "—"}</span>
								</div>
								<div className="flex justify-between px-4 py-2.5 text-sm">
									<span>Salesperson</span>
									<span>—</span>
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* Divider */}
				<div className="h-1 bg-gradient-to-r from-primary/60 to-primary/20" />

				{/* Line Items Table */}
				<div className="p-6">
					<table className="w-full">
						<thead>
							<tr className="border-b text-sm">
								<th className="text-left font-semibold pb-3">Product / Service</th>
								<th className="text-center font-semibold pb-3 w-24">Qty.</th>
								<th className="text-right font-semibold pb-3 w-32">Unit Price</th>
								<th className="text-right font-semibold pb-3 w-32">Total</th>
							</tr>
						</thead>
						<tbody>
							{invoice.lineItems.length > 0 ? (
								invoice.lineItems.map((item) => (
									<tr key={item.id} className="border-b last:border-b-0">
										<td className="py-3">
											<p className="text-sm font-medium">{item.name}</p>
											{item.description && (
												<p className="text-sm text-muted-foreground">{item.description}</p>
											)}
										</td>
										<td className="text-center text-sm py-3">{item.qty}</td>
										<td className="text-right text-sm py-3">{formatCurrency(Number(item.unitPrice))}</td>
										<td className="text-right text-sm py-3">{formatCurrency(item.qty * Number(item.unitPrice))}</td>
									</tr>
								))
							) : (
								<tr>
									<td colSpan={4} className="text-center text-sm text-muted-foreground py-6">
										No line items
									</td>
								</tr>
							)}
						</tbody>
					</table>
				</div>

				{/* Totals */}
				<div className="px-6 pb-6">
					<div className="max-w-sm ml-auto">
						<div className="flex justify-between text-sm py-2 border-t">
							<span>Subtotal</span>
							<span>{formatCurrency(subtotal)}</span>
						</div>
						<div className="flex justify-between text-sm py-2 border-t font-semibold">
							<span>Total</span>
							<span>{formatCurrency(total)}</span>
						</div>
						<div className="h-0.5 bg-primary my-1" />
						<div className="flex justify-between text-sm py-2">
							<div>
								<span>Account balance</span>
								<p className="text-xs text-muted-foreground">(Including this draft)</p>
							</div>
							<span>{formatCurrency(balance)}</span>
						</div>
					</div>
				</div>

				{/* Contract / Disclaimer */}
				{invoice.clientMessage && (
					<div className="px-6 pb-8 pt-4">
						<h3 className="text-sm font-semibold mb-2">Contract / Disclaimer</h3>
						<p className="text-sm text-muted-foreground">{invoice.clientMessage}</p>
					</div>
				)}
			</div>
		</div>
	);
};

export default InvoiceDetailPage;
