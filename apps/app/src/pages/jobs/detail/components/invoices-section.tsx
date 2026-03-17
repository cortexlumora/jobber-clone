import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { getJobInvoices, getInvoiceReminders, deleteInvoiceReminder } from "../../api";
import { formatCurrency, formatDate } from "@/lib/format";
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
import { Plus, ChevronLeft, ChevronRight, Bell, Trash2 } from "lucide-react";
import InvoiceReminderDialog from "./invoice-reminder-dialog";

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
	jobNumber?: string | null;
	clientName?: string;
	clientPhone?: string | null;
	clientAddress?: string | null;
}

const InvoicesSection = ({ jobId, jobNumber, clientName, clientPhone, clientAddress }: InvoicesSectionProps) => {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const [page, setPage] = useState(1);
	const [reminderPage, setReminderPage] = useState(1);
	const [activeTab, setActiveTab] = useState<"billing" | "reminders">("billing");
	const [reminderDialogOpen, setReminderDialogOpen] = useState(false);

	const { data: result } = useQuery({
		queryKey: ["job-invoices", jobId, page],
		queryFn: () => getJobInvoices(jobId, page),
		placeholderData: (p) => p,
		staleTime: 30_000,
	});

	const invoices = result?.data ?? [];
	const total = result?.pagination?.total ?? 0;
	const totalPages = Math.ceil(total / PAGE_SIZE);

	const { data: reminderResult } = useQuery({
		queryKey: ["job-invoice-reminders", jobId, reminderPage],
		queryFn: () => getInvoiceReminders(jobId, reminderPage),
		placeholderData: (p) => p,
		staleTime: 30_000,
	});

	const reminders = reminderResult?.data ?? [];
	const reminderTotal = reminderResult?.pagination?.total ?? 0;
	const reminderTotalPages = Math.ceil(reminderTotal / PAGE_SIZE);

	const deleteReminderMutation = useMutation({
		mutationFn: (reminderId: string) => deleteInvoiceReminder(jobId, reminderId),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["job-invoice-reminders", jobId] });
		},
	});

	return (
		<div className="rounded-lg border bg-background">
			{/* Header */}
			<div className="px-5 py-3 border-b flex items-center justify-between min-h-14">
				<h3 className="text-sm font-semibold">Invoices{total > 0 && ` (${total})`}</h3>
				<Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => navigate(`/invoices/create?jobId=${jobId}`)}>
					<Plus className="h-3 w-3 mr-1" />
					Create Invoice
				</Button>
			</div>

			{/* Tabs */}
			<div className="px-5 pt-3">
				<div className="flex gap-4 border-b">
					<button
						type="button"
						className={`pb-2 text-sm font-medium border-b-2 transition-colors ${activeTab === "billing" ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}
						onClick={() => setActiveTab("billing")}
					>
						Billing
					</button>
					<button
						type="button"
						className={`pb-2 text-sm font-medium border-b-2 transition-colors ${activeTab === "reminders" ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}
						onClick={() => setActiveTab("reminders")}
					>
						Reminders
					</button>
				</div>
			</div>

			{/* Content */}
			<div className="px-5 py-4">
				{activeTab === "billing" ? (
					<>
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
					</>
				) : (
					reminders.length === 0 ? (
						<div className="flex flex-col items-center justify-center py-10 text-center">
							<Bell className="h-8 w-8 text-muted-foreground mb-3" />
							<p className="text-sm font-medium">No reminders yet</p>
							<p className="text-xs text-muted-foreground mt-1">
								Invoice reminders will appear here once configured
							</p>
							<Button variant="outline" size="sm" className="mt-4" onClick={() => setReminderDialogOpen(true)}>
								<Plus className="h-3 w-3 mr-1" />
								Create Reminder
							</Button>
						</div>
					) : (
						<>
							<div className="flex justify-end mb-3">
								<Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setReminderDialogOpen(true)}>
									<Plus className="h-3 w-3 mr-1" />
									Add Reminder
								</Button>
							</div>
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead className="text-xs">Details</TableHead>
										<TableHead className="text-xs">Date</TableHead>
										<TableHead className="text-xs">Status</TableHead>
										<TableHead className="w-10" />
									</TableRow>
								</TableHeader>
								<TableBody>
									{reminders.map((reminder) => (
										<TableRow key={reminder.id}>
											<TableCell className="text-sm">{reminder.details || "—"}</TableCell>
											<TableCell className="text-sm">
												{reminder.scheduleLater ? "Schedule later" : reminder.startDate ? formatDate(new Date(reminder.startDate + "T00:00:00")) : "—"}
											</TableCell>
											<TableCell>
												<Badge variant="secondary" className={
													reminder.status === "completed" ? "bg-green-100 text-green-700" :
													reminder.status === "cancelled" ? "bg-red-100 text-red-700" :
													"bg-blue-100 text-blue-700"
												}>
													{reminder.status.charAt(0).toUpperCase() + reminder.status.slice(1)}
												</Badge>
											</TableCell>
											<TableCell>
												<Button
													variant="ghost"
													size="sm"
													className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
													onClick={() => deleteReminderMutation.mutate(reminder.id)}
												>
													<Trash2 className="h-3.5 w-3.5" />
												</Button>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
							{reminderTotalPages > 1 && (
								<div className="flex items-center justify-between px-4 py-3 border-t">
									<p className="text-xs text-muted-foreground">
										{(reminderPage - 1) * PAGE_SIZE + 1}–{Math.min(reminderPage * PAGE_SIZE, reminderTotal)} of {reminderTotal}
									</p>
									<div className="flex items-center gap-1">
										<Button variant="ghost" size="icon" className="h-7 w-7" disabled={reminderPage <= 1} onClick={() => setReminderPage((p) => p - 1)}>
											<ChevronLeft className="h-4 w-4" />
										</Button>
										<Button variant="ghost" size="icon" className="h-7 w-7" disabled={reminderPage >= reminderTotalPages} onClick={() => setReminderPage((p) => p + 1)}>
											<ChevronRight className="h-4 w-4" />
										</Button>
									</div>
								</div>
							)}
						</>
				))}
			</div>

			<InvoiceReminderDialog
				open={reminderDialogOpen}
				onOpenChange={setReminderDialogOpen}
				jobId={jobId}
				jobNumber={jobNumber}
				clientName={clientName}
				clientPhone={clientPhone}
				clientAddress={clientAddress}
			/>
		</div>
	);
};

export default InvoicesSection;
