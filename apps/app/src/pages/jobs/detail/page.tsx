import { useState } from "react";
import { parseAsBoolean, useQueryState } from "nuqs";
import { useParams, useNavigate } from "react-router";
import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getJobById, getJobNotes, updateJobLineItems } from "../api";
import NotesPanel from "@/components/notes-panel";
import Section from "@/components/section";
import LineItemsView from "@/components/line-items-view";
import LineItemsCard, { type LineItemUI } from "@/components/line-items-card";
import { formatScheduleDate, formatCurrency, getInitials } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import ScheduleVisitDialog from "@/components/schedule-visit-dialog";
import LaborSection from "./components/labor-section";
import ExpensesSection from "./components/expenses-section";
import InvoicesSection from "./components/invoices-section";
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
	const navigate = useNavigate();
	const queryClient = useQueryClient();

	const [editingLineItems, setEditingLineItems] = useState(false);
	const [editLineItems, setEditLineItems] = useState<LineItemUI[]>([]);
	const [visitDialogOpen, setVisitDialogOpen] = useQueryState("schedule-visit", parseAsBoolean.withDefault(false));

	const { data: job, isLoading } = useQuery({
		queryKey: ["job", id],
		queryFn: async () => {
			const data = await getJobById(id!);
			if (data) {
				queryClient.setQueryData(["job-time-entries", id, 1], data.timeEntries);
				queryClient.setQueryData(["job-expenses", id, 1], data.expenses);
				queryClient.setQueryData(["job-notes", id], { pages: [data.clientNotes], pageParams: [1] });
				queryClient.setQueryData(["job-invoices", id, 1], data.invoices);
			}
			return data;
		},
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

	const { data: notesData, hasNextPage, fetchNextPage, isFetchingNextPage } = useInfiniteQuery({
		queryKey: ["job-notes", id],
		queryFn: ({ pageParam }) => getJobNotes(id!, pageParam),
		initialPageParam: 1,
		getNextPageParam: (last) => last.pagination.page < last.pagination.totalPages ? last.pagination.page + 1 : undefined,
		enabled: !!job,
		staleTime: 30_000,
	});

	const allNotes = notesData?.pages.flatMap((p) => p.data) ?? [];
	const notesTotal = notesData?.pages[0]?.pagination.total;

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

	if (isLoading) {
		return <p className="text-muted-foreground p-4">Loading...</p>;
	}

	if (!job) {
		return <p className="text-muted-foreground p-4">Job not found</p>;
	}

	const status = statusConfig[job.status] ?? statusConfig.draft;
	const { client, property } = job;
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
	const totalLabor = job.timeEntries.data.reduce((sum, entry) => sum + Number(entry.totalCost), 0);
	const totalExpenses = job.expenses.data.reduce((sum, expense) => sum + Number(expense.total), 0);
	const profit = totalPrice - totalCost - totalLabor - totalExpenses;
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
							<DropdownMenuItem onClick={() => navigate(`/invoices/create?jobId=${id}`)}>Create Invoice</DropdownMenuItem>
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
									<span>{formatCurrency(totalExpenses)}</span>
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

					<LaborSection jobId={id!} />
					<ExpensesSection jobId={id!} />

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

					<InvoicesSection jobId={id!} />
				</div>

				{/* Right - Notes (30%) */}
				<div className="sticky top-[4.5rem] h-[calc(100vh-5.5rem)]">
					<NotesPanel notes={allNotes} total={notesTotal} hasMore={hasNextPage} onLoadMore={fetchNextPage} isLoadingMore={isFetchingNextPage} className="h-full" />
				</div>
			</div>

			<ScheduleVisitDialog
				open={visitDialogOpen}
				onOpenChange={setVisitDialogOpen}
				jobId={id!}
				assignedTo={job.salesperson}
			/>

		</div>
	);
};

export default JobDetailPage;
