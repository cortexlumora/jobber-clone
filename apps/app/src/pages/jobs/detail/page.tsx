import { useState } from "react";
import { parseAsBoolean, useQueryState } from "nuqs";
import { useParams } from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getJobById, updateJobLineItems } from "../api";
import { getClientById } from "@/pages/clients/api";
import NotesPanel from "@/components/notes-panel";
import Section from "@/components/section";
import LineItemsView from "@/components/line-items-view";
import LineItemsCard, { type LineItemUI } from "@/components/line-items-card";
import { formatScheduleDate, formatCurrency, formatDate, getInitials } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import ScheduleVisitDialog from "@/components/schedule-visit-dialog";
import TimeEntryDialog from "@/components/time-entry-dialog";
import { deleteTimeEntry } from "../time-entries-api";
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
	Pencil,
	Calendar,
	Plus,
	Trash2,
	Clock,
} from "lucide-react";


const statusConfig: Record<string, { label: string; className: string }> = {
	draft: { label: "Draft", className: "bg-gray-100 text-gray-800" },
	active: { label: "Active", className: "bg-green-100 text-green-800" },
	action_required: { label: "Action Required", className: "bg-amber-100 text-amber-800" },
	complete: { label: "Complete", className: "bg-blue-100 text-blue-800" },
	archived: { label: "Archived", className: "bg-gray-100 text-gray-800" },
};


// ── Main Page ────────────────────────────────────────────────────────

const JobDetailPage = () => {
	const { id } = useParams<{ id: string }>();
	const queryClient = useQueryClient();

	const [editingLineItems, setEditingLineItems] = useState(false);
	const [editLineItems, setEditLineItems] = useState<LineItemUI[]>([]);
	const [visitDialogOpen, setVisitDialogOpen] = useQueryState("schedule-visit", parseAsBoolean.withDefault(false));
	const [timeEntryDialogOpen, setTimeEntryDialogOpen] = useQueryState("new-time-entry", parseAsBoolean.withDefault(false));

	const { data: job, isLoading } = useQuery({
		queryKey: ["job", id],
		queryFn: () => getJobById(id!),
		enabled: !!id,
	});

	const lineItemsMutation = useMutation({
		mutationFn: (data: { lineItems: { name: string; description?: string; qty: number; unitCost: number; unitPrice: number; imageFileId?: string }[] }) =>
			updateJobLineItems(id!, data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["job", id] });
			setEditingLineItems(false);
		},
	});

	const deleteTimeEntryMutation = useMutation({
		mutationFn: (entryId: string) => deleteTimeEntry(id!, entryId),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["job", id] });
		},
	});

	const startEditingLineItems = () => {
		if (!job) return;
		setEditLineItems(
			job.lineItems.map((item) => ({
				name: item.name,
				description: item.description ?? "",
				qty: item.qty,
				unitPrice: Number(item.unitPrice),
				imageFileId: item.image?.id ?? null,
				imagePreview: null,
				imageUploading: false,
			})),
		);
		setEditingLineItems(true);
	};

	const saveLineItems = () => {
		lineItemsMutation.mutate({
			lineItems: editLineItems.map((item) => ({
				name: item.name,
				description: item.description || undefined,
				qty: item.qty,
				unitCost: 0,
				unitPrice: item.unitPrice,
				imageFileId: item.imageFileId || undefined,
			})),
		});
	};

	const { data: client } = useQuery({
		queryKey: ["client", job?.clientId],
		queryFn: () => getClientById(job!.clientId),
		enabled: !!job?.clientId,
	});

	if (isLoading) {
		return <p className="text-muted-foreground p-4">Loading...</p>;
	}

	if (!job) {
		return <p className="text-muted-foreground p-4">Job not found</p>;
	}

	const status = statusConfig[job.status] ?? statusConfig.draft;
	const property = client?.propertyDetails?.data?.[0];
	const address = property
		? [property.street1, property.street2].filter(Boolean).join(", ")
		: null;
	const cityStateZip = property
		? [property.city, [property.state, property.zip].filter(Boolean).join(" ")].filter(Boolean).join(", ")
		: null;

	const clientDisplayName = client
		? client.useCompanyAsPrimary && client.companyName
			? client.companyName
			: `${client.title !== "none" ? `${client.title} ` : ""}${client.firstName} ${client.lastName}`
		: "";

	const isUnscheduled = !job.startDate;
	const totalPrice = job.lineItems.reduce((sum, item) => sum + item.qty * Number(item.unitPrice), 0);
	const totalCost = job.lineItems.reduce((sum, item) => sum + item.qty * Number(item.unitCost), 0);
	const totalLabor = job.timeEntries.reduce((sum, entry) => sum + Number(entry.totalCost), 0);
	const profit = totalPrice - totalCost - totalLabor;
	const profitMargin = totalPrice > 0 ? Math.round((profit / totalPrice) * 100) : 0;

	const billingLabel = job.billingType === "visit_based"
		? "Per visit"
		: job.billingType === "fixed_price"
			? "Fixed price"
			: "Upon job completion";

	return (
		<div className="max-w-7xl mx-auto">
			{/* Header */}
			<div className="flex items-center justify-between mb-6">
				<div className="flex items-center gap-3">
					<Badge className={isUnscheduled ? "bg-gray-100 text-gray-800" : status.className}>
						{isUnscheduled ? "Unscheduled" : status.label}
					</Badge>
				</div>
				<div className="flex items-center gap-2">
					<Button variant="outline" size="sm">
						<Calendar className="h-4 w-4 mr-1" />
						Set Date for Visit
					</Button>
					<Button variant="outline" size="sm">
						<Pencil className="h-4 w-4 mr-1" />
						Edit
					</Button>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="outline" size="sm">
								<MoreHorizontal className="h-4 w-4 mr-1" />
								More Actions
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuItem>Mark Active</DropdownMenuItem>
							<DropdownMenuItem>Mark Complete</DropdownMenuItem>
							<DropdownMenuItem>Create Invoice</DropdownMenuItem>
							<DropdownMenuItem>Archive</DropdownMenuItem>
							<DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</div>

			<div className="grid grid-cols-[1fr_30%] gap-6">
				{/* Left - Main Content */}
				<div className="space-y-5">
					{/* Client & Job Info */}
					<div className="rounded-lg border bg-background px-5 py-4">
						<div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
							{job.jobNumber && <span>Job #{job.jobNumber}</span>}
						</div>
						<div className="flex items-start gap-4 mt-2">
							<div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-sm font-medium shrink-0">
								{clientDisplayName ? getInitials(clientDisplayName) : "?"}
							</div>
							<div className="flex-1 min-w-0">
								<p className="font-medium">{clientDisplayName}</p>
								<p className="text-sm text-muted-foreground">{job.title}</p>
							</div>
						</div>

						{/* Property Address */}
						{(address || cityStateZip) && (
							<div className="mt-4 pt-4 border-t">
								<p className="text-xs font-medium text-muted-foreground mb-1">Property address</p>
								<div className="flex items-start gap-2 text-sm">
									<MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0 text-muted-foreground" />
									<div>
										{address && <p>{address}</p>}
										{cityStateZip && <p>{cityStateZip}</p>}
									</div>
								</div>
							</div>
						)}

						{/* Contact Details */}
						{(client?.phones?.[0] || client?.emails?.[0]) && (
							<div className="mt-4 pt-4 border-t">
								<p className="text-xs font-medium text-muted-foreground mb-1">Contact details</p>
								<div className="space-y-1">
									{client?.phones?.[0] && (
										<div className="flex items-center gap-2 text-sm">
											<Phone className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
											<span>{client.phones[0].number}</span>
										</div>
									)}
									{client?.emails?.[0] && (
										<div className="flex items-center gap-2 text-sm">
											<Mail className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
											<span>{client.emails[0].value}</span>
										</div>
									)}
								</div>
							</div>
						)}
					</div>

					{/* Job Details */}
					<Section title="Job details">
						<div className="grid grid-cols-2 gap-x-8 gap-y-3">
							<div>
								<p className="text-xs text-muted-foreground mb-0.5">Job type</p>
								<p className="text-sm font-medium capitalize">
									{job.jobType === "one_off" ? "One-off job" : "Recurring job"}
								</p>
							</div>
							<div>
								<p className="text-xs text-muted-foreground mb-0.5">Schedule</p>
								<p className="text-sm font-medium">
									{job.startDate
										? formatScheduleDate(job.startDate, job.startTime, job.endTime)
										: "Not set"}
								</p>
							</div>
							<div>
								<p className="text-xs text-muted-foreground mb-0.5">Billing frequency</p>
								<p className="text-sm font-medium">{billingLabel}</p>
							</div>
							<div>
								<p className="text-xs text-muted-foreground mb-0.5">Salesperson</p>
								{job.salesperson ? (
									<div className="flex items-center gap-2">
										<div className="h-5 w-5 rounded-full bg-muted flex items-center justify-center text-[9px] font-medium">
											{getInitials(job.salesperson)}
										</div>
										<p className="text-sm font-medium">{job.salesperson}</p>
									</div>
								) : (
									<p className="text-sm text-muted-foreground">—</p>
								)}
							</div>
						</div>
					</Section>

					{/* Profitability */}
					<Section title="Profitability">
						<div className="space-y-3">
							<div className="flex items-center gap-3">
								<span className="text-2xl font-semibold">{profitMargin}%</span>
								<span className="text-sm text-muted-foreground">Profit margin</span>
							</div>
							<div className="space-y-2 pt-2">
								<div className="flex justify-between text-sm">
									<span className="text-muted-foreground">Total price</span>
									<span className="font-medium">{formatCurrency(totalPrice)}</span>
								</div>
								<div className="flex justify-between text-sm">
									<span className="text-muted-foreground flex items-center gap-1">
										<span className="text-muted-foreground">−</span> Line Item Cost
									</span>
									<span>{formatCurrency(totalCost)}</span>
								</div>
								<div className="flex justify-between text-sm">
									<span className="text-muted-foreground flex items-center gap-1">
										<span className="text-muted-foreground">−</span> Labor
									</span>
									<span>{formatCurrency(totalLabor)}</span>
								</div>
								<div className="flex justify-between text-sm">
									<span className="text-muted-foreground flex items-center gap-1">
										<span className="text-muted-foreground">−</span> Expenses
									</span>
									<span>{formatCurrency(0)}</span>
								</div>
								<div className="flex justify-between text-sm pt-2 border-t font-semibold">
									<span className="flex items-center gap-1">
										<span>=</span> Profit
									</span>
									<span>{formatCurrency(profit)}</span>
								</div>
							</div>
						</div>
					</Section>

					{/* Line Items */}
					{editingLineItems ? (
						<Section title="Line Items">
							<LineItemsCard
								items={editLineItems}
								onChange={setEditLineItems}
								onSave={saveLineItems}
								onCancel={() => setEditingLineItems(false)}
								saving={lineItemsMutation.isPending}
								hideHeader
							/>
						</Section>
					) : (
						<Section
							title="Line Items"
							action={
								<Button variant="ghost" size="sm" className="h-7 text-xs" onClick={startEditingLineItems}>
									<Pencil className="h-3 w-3 mr-1" />
									Edit
								</Button>
							}
						>
							{job.lineItems.length > 0 ? (
								<LineItemsView items={job.lineItems} showCost />
							) : (
								<p className="text-sm text-muted-foreground">No line items</p>
							)}
						</Section>
					)}

					{/* Labor */}
					<Section
						title="Labor"
						action={
							<Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setTimeEntryDialogOpen(true)}>
								<Plus className="h-3 w-3 mr-1" />
								New Time Entry
							</Button>
						}
					>
						{job.timeEntries.length > 0 ? (
							<div className="space-y-2">
								{job.timeEntries.map((entry) => {
									const h = Math.floor(entry.durationMinutes / 60);
									const m = entry.durationMinutes % 60;
									return (
										<div key={entry.id} className="rounded-md border px-4 py-3 flex items-center justify-between">
											<div className="flex items-center gap-3">
												<div className="h-8 w-8 rounded-full bg-orange-50 flex items-center justify-center">
													<Clock className="h-4 w-4 text-orange-600" />
												</div>
												<div>
													<p className="text-sm font-medium">{entry.employee}</p>
													<p className="text-xs text-muted-foreground">
														{formatDate(new Date(entry.date + "T00:00:00"))} · {h}h {m > 0 ? `${m}m` : ""}
													</p>
												</div>
											</div>
											<div className="flex items-center gap-3">
												<span className="text-sm font-medium">{formatCurrency(Number(entry.totalCost))}</span>
												<Button
													variant="ghost"
													size="sm"
													className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
													onClick={() => deleteTimeEntryMutation.mutate(entry.id)}
												>
													<Trash2 className="h-3.5 w-3.5" />
												</Button>
											</div>
										</div>
									);
								})}
							</div>
						) : (
							<p className="text-sm text-muted-foreground">
								Time tracked to this job by you or your team will show here
							</p>
						)}
					</Section>

					{/* Expenses */}
					<Section
						title="Expenses"
						action={
							<Button variant="ghost" size="sm" className="h-7 text-xs">
								<Plus className="h-3 w-3 mr-1" />
								New Expense
							</Button>
						}
					>
						<p className="text-sm text-muted-foreground">
							Get an accurate picture of various job costs by recording expenses
						</p>
					</Section>

					{/* Visits */}
					<Section
						title="Visits"
						action={
							<Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setVisitDialogOpen(true)}>
								<Plus className="h-3 w-3 mr-1" />
								New Visit
							</Button>
						}
					>
						<div className="space-y-2">
							{job.visits.length > 0 ? (
								job.visits.map((visit, i) => {
									const isScheduled = !visit.scheduleLater && visit.startDate;
									return (
										<div key={i} className="rounded-md border px-4 py-3 flex items-center justify-between">
											<div className="flex items-center gap-3">
												<div className={`h-8 w-8 rounded-full flex items-center justify-center ${isScheduled ? "bg-blue-50" : "bg-gray-100"}`}>
													<Calendar className={`h-4 w-4 ${isScheduled ? "text-blue-600" : "text-muted-foreground"}`} />
												</div>
												<div>
													<p className="text-sm font-medium">
														{isScheduled
															? formatScheduleDate(visit.startDate!, visit.startTime, visit.endTime)
															: visit.title}
													</p>
													{visit.assignedTo && (
														<p className="text-xs text-muted-foreground">Assigned to {visit.assignedTo}</p>
													)}
												</div>
											</div>
											<Badge
												variant="secondary"
												className={
													visit.status === "completed" ? "bg-green-100 text-green-700" :
													visit.status === "cancelled" ? "bg-red-100 text-red-700" :
													isScheduled ? "bg-blue-100 text-blue-700" :
													"bg-gray-100 text-gray-700"
												}
											>
												{visit.status === "completed" ? "Completed" :
												 visit.status === "cancelled" ? "Cancelled" :
												 isScheduled ? "Scheduled" : "Unscheduled"}
											</Badge>
										</div>
									);
								})
							) : (
								<p className="text-sm text-muted-foreground">No visits scheduled</p>
							)}
						</div>
					</Section>

					{/* Invoices */}
					<Section
						title="Invoices"
						action={
							<Button variant="ghost" size="sm" className="h-7 text-xs">
								<Plus className="h-3 w-3 mr-1" />
								Create Invoice
							</Button>
						}
					>
						<div>
							<div className="flex gap-4 text-xs text-muted-foreground mb-2">
								<span className="font-medium">Billing</span>
								<span>Reminders</span>
							</div>
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
									<TableRow>
										<TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-6">
											No invoices yet
										</TableCell>
									</TableRow>
								</TableBody>
							</Table>
						</div>
					</Section>
				</div>

				{/* Right - Notes (30%) */}
				<div className="sticky top-[4.5rem] h-[calc(100vh-5.5rem)]">
					<NotesPanel clientId={job.clientId} className="h-full" />
				</div>
			</div>

			<ScheduleVisitDialog
				open={visitDialogOpen}
				onOpenChange={setVisitDialogOpen}
				jobId={id!}
				assignedTo={job.salesperson}
			/>

			<TimeEntryDialog
				open={timeEntryDialogOpen}
				onOpenChange={setTimeEntryDialogOpen}
				jobId={id!}
			/>
		</div>
	);
};

export default JobDetailPage;
