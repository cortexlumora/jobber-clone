import { useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { getQuoteById } from "../api";
import { getClientById } from "@/pages/clients/api";
import NotesPanel from "@/components/notes-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	MoreHorizontal,
	Mail,
	Phone,
	MapPin,
	ImageIcon,
} from "lucide-react";

// ── Helpers ──────────────────────────────────────────────────────────

function formatDate(date: Date | string) {
	const d = new Date(date);
	return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function getInitials(name: string) {
	return name
		.split(" ")
		.map((n) => n[0])
		.join("")
		.slice(0, 2)
		.toUpperCase();
}

function formatCurrency(amount: number) {
	return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}

const statusConfig: Record<string, { label: string; className: string }> = {
	draft: { label: "Draft", className: "bg-gray-100 text-gray-800" },
	sent: { label: "Awaiting response", className: "bg-blue-100 text-blue-800" },
	approved: { label: "Approved", className: "bg-green-100 text-green-800" },
	rejected: { label: "Rejected", className: "bg-red-100 text-red-800" },
	archived: { label: "Archived", className: "bg-gray-100 text-gray-800" },
};

// ── Section wrapper ──────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
	return (
		<div className="rounded-lg border bg-background">
			<div className="px-5 py-3 border-b">
				<h3 className="text-sm font-semibold">{title}</h3>
			</div>
			<div className="px-5 py-4">{children}</div>
		</div>
	);
}

// ── Main Page ────────────────────────────────────────────────────────

const QuoteDetailPage = () => {
	const { id } = useParams<{ id: string }>();

	const { data: quote, isLoading } = useQuery({
		queryKey: ["quote", id],
		queryFn: () => getQuoteById(id!),
		enabled: !!id,
	});

	const { data: client } = useQuery({
		queryKey: ["client", quote?.clientId],
		queryFn: () => getClientById(quote!.clientId),
		enabled: !!quote?.clientId,
	});

	if (isLoading) {
		return <p className="text-muted-foreground p-4">Loading...</p>;
	}

	if (!quote) {
		return <p className="text-muted-foreground p-4">Quote not found</p>;
	}

	const status = statusConfig[quote.status] ?? statusConfig.draft;
	const property = client?.propertyDetails?.data?.[0];
	const address = property
		? [property.street1, property.street2, property.city, property.state, property.zip]
				.filter(Boolean)
				.join(", ")
		: null;

	const clientDisplayName = client
		? client.useCompanyAsPrimary && client.companyName
			? client.companyName
			: `${client.title !== "none" ? `${client.title} ` : ""}${client.firstName} ${client.lastName}`
		: "";

	const lineItems = quote.lineItems.filter((i) => i.type === "line_item");
	const subtotal = lineItems.reduce(
		(sum, item) => sum + item.qty * Number(item.unitPrice),
		0,
	);
	const discount = quote.discount ? Number(quote.discount) : 0;
	const tax = quote.tax ? Number(quote.tax) : 0;
	const total = subtotal - discount + tax;

	return (
		<div className="max-w-7xl mx-auto">
			{/* Header */}
			<div className="flex items-center justify-between mb-6">
				<div className="flex items-center gap-3">
					<Badge className={status.className}>{status.label}</Badge>
				</div>
				<div className="flex items-center gap-2">
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="outline" size="sm">
								<MoreHorizontal className="h-4 w-4 mr-1" />
								More
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuItem>Convert to Job</DropdownMenuItem>
							<DropdownMenuItem>Convert to Invoice</DropdownMenuItem>
							<DropdownMenuItem>Duplicate</DropdownMenuItem>
							<DropdownMenuItem>Archive</DropdownMenuItem>
							<DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
					<Button size="sm">
						<Mail className="h-4 w-4 mr-1" />
						Send Email
					</Button>
				</div>
			</div>

			<div className="grid grid-cols-[1fr_30%] gap-6">
				{/* Left - Main Content */}
				<div className="space-y-5">
					{/* Client Info */}
					<div className="rounded-lg border bg-background px-5 py-4">
						<p className="text-lg font-semibold mb-3">{quote.title}</p>

						<div className="flex items-start gap-4">
							<div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-sm font-medium shrink-0">
								{clientDisplayName ? getInitials(clientDisplayName) : "?"}
							</div>
							<div className="flex-1 min-w-0 space-y-1.5">
								<p className="font-medium">{clientDisplayName}</p>

								{address && (
									<div>
										<p className="text-xs text-muted-foreground font-medium mb-0.5">Property Address</p>
										<div className="flex items-start gap-2 text-sm text-muted-foreground">
											<MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0" />
											<span>{address}</span>
										</div>
									</div>
								)}

								{client?.phones?.[0] && (
									<div className="flex items-center gap-2 text-sm text-muted-foreground">
										<Phone className="h-3.5 w-3.5 shrink-0" />
										<span>{client.phones[0].number}</span>
									</div>
								)}
								{client?.emails?.[0] && (
									<div className="flex items-center gap-2 text-sm text-muted-foreground">
										<Mail className="h-3.5 w-3.5 shrink-0" />
										<span>{client.emails[0].value}</span>
									</div>
								)}
							</div>
						</div>

						{/* Quote metadata grid */}
						<div className="grid grid-cols-2 gap-x-8 gap-y-3 mt-4 pt-4 border-t">
							{quote.quoteNumber && (
								<div>
									<p className="text-xs text-muted-foreground mb-0.5">Quote #</p>
									<p className="text-sm font-medium">{quote.quoteNumber}</p>
								</div>
							)}
							{quote.salesperson && (
								<div>
									<p className="text-xs text-muted-foreground mb-0.5">Salesperson</p>
									<div className="flex items-center gap-2">
										<div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-medium">
											{getInitials(quote.salesperson)}
										</div>
										<p className="text-sm font-medium">{quote.salesperson}</p>
									</div>
								</div>
							)}
							<div>
								<p className="text-xs text-muted-foreground mb-0.5">Created</p>
								<p className="text-sm font-medium">{formatDate(quote.createdAt)}</p>
							</div>
							{quote.status !== "draft" && (
								<div>
									<p className="text-xs text-muted-foreground mb-0.5">Sent</p>
									<p className="text-sm font-medium">{formatDate(quote.updatedAt)}</p>
								</div>
							)}
						</div>
					</div>

					{/* Introduction */}
					{(quote.introTitle || quote.introDescription || quote.introImageFileId) && (
						<Section title="Introduction">
							<div className="space-y-3">
								{quote.introImageFileId && (
									<div className="h-40 w-full rounded-lg border bg-muted flex items-center justify-center overflow-hidden">
										<ImageIcon className="h-8 w-8 text-muted-foreground" />
									</div>
								)}
								{quote.introTitle && (
									<p className="text-sm font-medium">{quote.introTitle}</p>
								)}
								{quote.introDescription && (
									<p className="text-sm text-muted-foreground">{quote.introDescription}</p>
								)}
							</div>
						</Section>
					)}

					{/* Line Items */}
					{lineItems.length > 0 && (
						<Section title="Product / Service">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead className="text-xs">Line Item</TableHead>
										<TableHead className="text-xs text-right w-20">Quantity</TableHead>
										<TableHead className="text-xs text-right w-24">Unit Price</TableHead>
										<TableHead className="text-xs text-right w-24">Total</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{lineItems.map((item) => {
										const itemTotal = item.qty * Number(item.unitPrice);
										return (
											<TableRow key={item.id}>
												<TableCell>
													<div className="flex items-center gap-3">
														{item.imageFileId && (
															<div className="h-9 w-9 rounded bg-muted flex items-center justify-center shrink-0">
																<ImageIcon className="h-4 w-4 text-muted-foreground" />
															</div>
														)}
														<div>
															<p className="text-sm font-medium">{item.name}</p>
															{item.description && (
																<p className="text-xs text-muted-foreground">{item.description}</p>
															)}
														</div>
													</div>
												</TableCell>
												<TableCell className="text-sm text-right">{item.qty}</TableCell>
												<TableCell className="text-sm text-right">
													{formatCurrency(Number(item.unitPrice))}
												</TableCell>
												<TableCell className="text-sm text-right font-medium">
													{formatCurrency(itemTotal)}
												</TableCell>
											</TableRow>
										);
									})}
								</TableBody>
							</Table>
							<div className="mt-3 pt-3 border-t space-y-1.5">
								<div className="flex justify-between text-sm">
									<span className="text-muted-foreground">Subtotal</span>
									<span>{formatCurrency(subtotal)}</span>
								</div>
								{discount > 0 && (
									<div className="flex justify-between text-sm">
										<span className="text-muted-foreground">Discount</span>
										<span className="text-red-600">-{formatCurrency(discount)}</span>
									</div>
								)}
								{tax > 0 && (
									<div className="flex justify-between text-sm">
										<span className="text-muted-foreground">Tax</span>
										<span>{formatCurrency(tax)}</span>
									</div>
								)}
								<div className="flex justify-between text-sm font-semibold pt-1.5 border-t">
									<span>Total</span>
									<span>{formatCurrency(total)}</span>
								</div>
							</div>
						</Section>
					)}

					{/* Payment Schedule */}
					{quote.depositType !== "none" && (
						<Section title={quote.depositType === "deposit" ? "Deposit" : "Payment Schedule"}>
							{quote.depositType === "deposit" && quote.depositValue && (
								<div className="flex items-center justify-between text-sm">
									<span className="text-muted-foreground">
										Required deposit ({quote.depositMode === "%" ? `${quote.depositValue}%` : formatCurrency(Number(quote.depositValue))})
									</span>
									<span className="font-medium">
										{quote.depositMode === "%"
											? formatCurrency((total * Number(quote.depositValue)) / 100)
											: formatCurrency(Number(quote.depositValue))}
									</span>
								</div>
							)}
							{quote.depositType === "schedule" && quote.payments && quote.payments.length > 0 && (
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead className="text-xs uppercase">% of Job</TableHead>
											<TableHead className="text-xs uppercase">Description</TableHead>
											<TableHead className="text-xs text-right uppercase">Total</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{quote.payments.map((payment, i) => (
											<TableRow key={i}>
												<TableCell className="text-sm">
													{quote.scheduleMode === "%" ? `${payment.amount}%` : formatCurrency(Number(payment.amount))}
												</TableCell>
												<TableCell className="text-sm">{payment.description || payment.label}</TableCell>
												<TableCell className="text-sm text-right font-medium">
													{quote.scheduleMode === "%"
														? formatCurrency((total * Number(payment.amount)) / 100)
														: formatCurrency(Number(payment.amount))}
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							)}
						</Section>
					)}

				</div>

				{/* Right - Notes (30%) */}
				<NotesPanel clientId={quote.clientId} />
			</div>
		</div>
	);
};

export default QuoteDetailPage;
