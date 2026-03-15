import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { createInvoiceSchema, type CreateInvoiceForm } from "@repo/zod/invoice";
import { getClientById, getClientProperties } from "@/pages/clients/api";
import { createInvoice } from "../api";
import { StickyFooter } from "@/components/sticky-footer";
import Section from "@/components/section";
import LineItemsCard, { type LineItemUI, createEmptyLineItem } from "@/components/line-items-card";
import { formatCurrency } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Phone, Mail, Plus, ChevronDown, RefreshCw, X } from "lucide-react";

const CreateInvoicePage = () => {
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	const clientId = searchParams.get("clientId") ?? "";

	const [lineItems, setLineItems] = useState<LineItemUI[]>([createEmptyLineItem()]);
	const [showDiscount, setShowDiscount] = useState(false);
	const [showTax, setShowTax] = useState(false);
	const [showFollowUps, setShowFollowUps] = useState(true);

	const { data: client } = useQuery({
		queryKey: ["client", clientId],
		queryFn: () => getClientById(clientId),
		enabled: !!clientId,
	});

	const { data: propertiesResult } = useQuery({
		queryKey: ["client-properties", clientId],
		queryFn: () => getClientProperties(clientId, 1, 10),
		enabled: !!clientId,
	});

	const {
		register,
		handleSubmit,
		watch,
		setValue,
		formState: { errors },
	} = useForm<CreateInvoiceForm>({
		resolver: zodResolver(createInvoiceSchema) as never,
		defaultValues: {
			clientId,
			invoiceNumber: "",
			subject: "",
			issuedDate: "",
			dueDate: "net_30",
			salesperson: "",
			discount: "",
			tax: "",
			clientMessage: "Thank you for your business. Please contact us with any questions regarding this invoice.",
			contract: "",
			noteContent: "",
		},
	});

	const discount = watch("discount");
	const tax = watch("tax");

	const mutation = useMutation({
		mutationFn: (data: CreateInvoiceForm) => createInvoice(data),
		onSuccess: (invoice) => {
			navigate(`/invoices/${invoice.id}`);
		},
	});

	const subtotal = lineItems.reduce((sum, item) => sum + item.qty * item.unitPrice, 0);
	const discountAmount = discount ? Number(discount) : 0;
	const taxAmount = tax ? Number(tax) : 0;
	const total = subtotal - discountAmount + taxAmount;

	const clientDisplayName = client
		? client.useCompanyAsPrimary && client.companyName
			? client.companyName
			: `${client.title !== "none" ? `${client.title} ` : ""}${client.firstName} ${client.lastName}`
		: "";

	const property = propertiesResult?.data?.[0];
	const billingAddress = property
		? [property.city, property.state].filter(Boolean).join(", ")
		: null;
	const propertyAddress = property
		? [property.street1, property.street2, property.city, property.state, property.zip].filter(Boolean).join(", ")
		: null;

	const phone = client?.phones?.[0]?.number;
	const email = client?.emails?.[0]?.value;

	const onSubmit = (data: CreateInvoiceForm) => {
		mutation.mutate({
			...data,
			lineItems: lineItems
				.filter((item) => item.name.trim())
				.map((item) => ({
					name: item.name,
					description: item.description || undefined,
					qty: item.qty,
					unitPrice: item.unitPrice,
					imageFileId: item.imageFileId || undefined,
				})),
		});
	};

	return (
		<StickyFooter.Root>
			<StickyFooter.Content className="max-w-5xl mx-auto">
				<form id="invoice-form" onSubmit={handleSubmit(onSubmit)}>
					{/* Top Card — Invoice Header */}
					<div className="rounded-lg border bg-background mb-6">
						<div className="p-6">
							{/* Title + Invoice Number */}
							<div className="flex items-start justify-between mb-5">
								<h2 className="text-2xl font-semibold">Invoice for {clientDisplayName}</h2>
								<div className="flex items-center gap-2 text-sm shrink-0">
									<span>Invoice #{watch("invoiceNumber") || "—"}</span>
									<Button type="button" variant="link" size="sm" className="p-0 h-auto text-xs">Change</Button>
								</div>
							</div>

							{/* Invoice Subject */}
							<div className="mb-6">
								<Label className="text-sm font-semibold mb-2 block">Invoice subject</Label>
								<Input {...register("subject")} placeholder="For Services Rendered" />
							</div>

							{/* Two-column: Client Info | Invoice Details */}
							<div className="grid grid-cols-[1fr_1fr] gap-8">
								{/* Left — Client Info */}
								<div className="flex flex-wrap gap-6">
									<div>
										<p className="text-sm font-semibold mb-1">Billing address</p>
										<p className="text-sm text-muted-foreground">{billingAddress ?? "—"}</p>
									</div>
									<div>
										<p className="text-sm font-semibold mb-1">Property Address</p>
										<p className="text-sm text-muted-foreground">
											{propertyAddress ? "(Same as billing address)" : "—"}
										</p>
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
								<div>
									<p className="text-sm font-semibold mb-3">Invoice details</p>
									<div className="space-y-3">
										<div className="flex items-center gap-3">
											<Label className="w-28 shrink-0 text-sm">Issued date</Label>
											<Input type="date" {...register("issuedDate")} defaultValue={new Date().toISOString().slice(0, 10)} className="flex-1" />
										</div>
										<div className="flex items-center gap-3">
											<Label className="w-28 shrink-0 text-sm">Payment due</Label>
											<Select value={watch("dueDate") || "net_30"} onValueChange={(v) => setValue("dueDate", v)}>
												<SelectTrigger className="flex-1">
													<SelectValue placeholder="Net 30" />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="upon_receipt">Upon Receipt</SelectItem>
													<SelectItem value="net_15">Net 15</SelectItem>
													<SelectItem value="net_30">Net 30</SelectItem>
													<SelectItem value="net_45">Net 45</SelectItem>
													<SelectItem value="net_60">Net 60</SelectItem>
												</SelectContent>
											</Select>
										</div>
										<div className="flex items-center gap-3">
											<Label className="w-28 shrink-0 text-sm">Salesperson</Label>
											<Button type="button" variant="outline" size="sm" className="gap-1">
												Add <Plus className="h-3 w-3" />
											</Button>
										</div>
									</div>
									<Button type="button" variant="link" size="sm" className="p-0 h-auto text-xs mt-4">
										<Plus className="h-3 w-3 mr-1" />
										Add Custom Field
									</Button>
								</div>
							</div>
						</div>

						{/* Follow-ups banner */}
						{showFollowUps && (
							<div className="border-t px-6 py-4 flex items-start gap-3">
								<RefreshCw className="h-5 w-5 mt-0.5 shrink-0 text-muted-foreground" />
								<div className="flex-1">
									<p className="text-sm font-semibold">Invoice follow-ups</p>
									<p className="text-sm text-muted-foreground mt-0.5">
										If left unpaid, we'll automatically send an email to the client
									</p>
									<Button type="button" variant="outline" size="sm" className="mt-2 text-xs">
										Change Schedule
									</Button>
								</div>
								<Button type="button" variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => setShowFollowUps(false)}>
									<X className="h-4 w-4" />
								</Button>
							</div>
						)}
					</div>

					{/* Line Items */}
					<Section title="Line Items">
						<LineItemsCard
							items={lineItems}
							onChange={setLineItems}
							hideHeader
						/>
						<Button
							type="button"
							variant="ghost"
							size="sm"
							className="mt-2 text-xs"
							onClick={() => setLineItems([...lineItems, createEmptyLineItem()])}
						>
							<Plus className="h-3 w-3 mr-1" />
							Add Line Item
						</Button>
					</Section>

					{/* Totals */}
					<div className="rounded-lg border bg-background mt-5 px-5 py-4">
						<div className="max-w-xs ml-auto space-y-3">
							<div className="flex justify-between text-sm">
								<span className="text-muted-foreground">Subtotal</span>
								<span className="font-medium">{formatCurrency(subtotal)}</span>
							</div>

							{showDiscount ? (
								<div className="flex justify-between text-sm items-center">
									<span className="text-muted-foreground">Discount</span>
									<Input
										type="number"
										step="0.01"
										className="w-32 h-8 text-right"
										{...register("discount")}
									/>
								</div>
							) : (
								<div className="flex justify-between text-sm">
									<span className="text-muted-foreground">Discount</span>
									<Button type="button" variant="link" size="sm" className="p-0 h-auto text-xs" onClick={() => setShowDiscount(true)}>
										Add Discount
									</Button>
								</div>
							)}

							{showTax ? (
								<div className="flex justify-between text-sm items-center">
									<span className="text-muted-foreground">Tax</span>
									<Input
										type="number"
										step="0.01"
										className="w-32 h-8 text-right"
										{...register("tax")}
									/>
								</div>
							) : (
								<div className="flex justify-between text-sm">
									<span className="text-muted-foreground">Tax</span>
									<Button type="button" variant="link" size="sm" className="p-0 h-auto text-xs" onClick={() => setShowTax(true)}>
										Add Tax
									</Button>
								</div>
							)}

							<div className="flex justify-between text-sm pt-2 border-t font-semibold">
								<span>Total</span>
								<span>{formatCurrency(total)}</span>
							</div>

							<div className="flex justify-between text-sm">
								<span className="text-muted-foreground">Deposits</span>
								<Button type="button" variant="link" size="sm" className="p-0 h-auto text-xs">
									Add Deposit
								</Button>
							</div>
						</div>
					</div>

					{/* Client Message */}
					<div className="mt-5">
						<Section title="Client message">
							<Textarea
								{...register("clientMessage")}
								rows={3}
							/>
						</Section>
					</div>

					{/* Contract / Disclaimer */}
					<div className="mt-5">
						<Section title="Contract / Disclaimer">
							<Textarea
								{...register("contract")}
								placeholder="Add contract terms or disclaimer..."
								rows={3}
							/>
						</Section>
					</div>

					{/* Internal Notes */}
					<div className="mt-5">
						<Section title="Internal notes">
							<p className="text-xs text-muted-foreground mb-2">Internal notes will only be seen by your team</p>
							<Textarea
								{...register("noteContent")}
								placeholder="Add a note..."
								rows={3}
							/>
						</Section>
					</div>
				</form>
			</StickyFooter.Content>

			<StickyFooter.Bar
				className="max-w-5xl"
				left={
					<Button type="button" variant="outline" onClick={() => navigate("/invoices")}>
						Cancel
					</Button>
				}
				right={
					<div className="flex gap-2">
						<Button type="submit" form="invoice-form" disabled={mutation.isPending}>
							{mutation.isPending ? "Saving..." : "Save Invoice"}
						</Button>
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant="outline">
									Save And...
									<ChevronDown className="h-4 w-4 ml-1" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								<DropdownMenuItem>Send as Text Message</DropdownMenuItem>
								<DropdownMenuItem>Send as Email</DropdownMenuItem>
								<DropdownMenuItem>Collect Payment</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				}
			/>
		</StickyFooter.Root>
	);
};

export default CreateInvoicePage;
