import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createInvoiceReminderSchema, type CreateInvoiceReminderForm } from "@repo/zod/invoice-reminder";
import { createInvoiceReminder } from "../../api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from "@/components/ui/dialog";
import { Plus, X } from "lucide-react";

interface InvoiceReminderDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	jobId: string;
	jobNumber?: string | null;
	clientName?: string;
	clientPhone?: string | null;
	clientAddress?: string | null;
}

const today = new Date().toISOString().slice(0, 10);

const defaultValues: CreateInvoiceReminderForm = {
	details: "",
	startDate: today,
	endDate: today,
	startTime: "",
	endTime: "",
	scheduleLater: false,
	allDay: true,
	assignedUserIds: [],
	emailTeam: false,
	teamReminder: "none",
};

const InvoiceReminderDialog = ({
	open,
	onOpenChange,
	jobId,
	jobNumber,
	clientName,
	clientPhone,
	clientAddress,
}: InvoiceReminderDialogProps) => {
	const queryClient = useQueryClient();
	const [showPaymentsBanner, setShowPaymentsBanner] = useState(true);

	const { register, handleSubmit, watch, setValue, reset } = useForm<CreateInvoiceReminderForm>({
		resolver: zodResolver(createInvoiceReminderSchema) as never,
		defaultValues,
	});

	const scheduleLater = watch("scheduleLater");
	const allDay = watch("allDay");
	const assignees = watch("assignedUserIds") ?? [];

	const mutation = useMutation({
		mutationFn: (data: CreateInvoiceReminderForm) => createInvoiceReminder(jobId, data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["job-invoice-reminders", jobId] });
			reset(defaultValues);
			onOpenChange(false);
		},
	});

	const onSubmit = (data: CreateInvoiceReminderForm) => {
		mutation.mutate(data);
	};

	return (
		<Dialog open={open} onOpenChange={(v) => { if (!v) reset(defaultValues); onOpenChange(v); }}>
			<DialogContent className="min-w-4xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>New invoice reminder</DialogTitle>
				</DialogHeader>

				<form onSubmit={handleSubmit(onSubmit)}>
					<div className="space-y-6 py-4">
						{/* Top section — Details + Job details */}
						<div className="grid grid-cols-[1fr_280px] gap-6">
							{/* Left — Details textarea */}
							<div className="space-y-4">
								<Textarea
									placeholder="Details"
									rows={6}
									{...register("details")}
								/>

								{showPaymentsBanner && (
									<div className="rounded-lg border bg-muted/30 p-4 flex items-start gap-3">
										<div className="flex-1">
											<p className="text-sm font-medium">
												Automate how you get paid when you turn on WorkPulse Payments
											</p>
											<Button type="button" variant="outline" size="sm" className="mt-2">
												Set Up WorkPulse Payments
											</Button>
										</div>
										<Button type="button" variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => setShowPaymentsBanner(false)}>
											<X className="h-4 w-4" />
										</Button>
									</div>
								)}
							</div>

							{/* Right — Job details */}
							<div>
								<p className="text-sm font-semibold mb-3">Job details</p>
								<div className="space-y-2 text-sm">
									<div className="flex gap-3">
										<span className="text-muted-foreground w-16 shrink-0">Job #</span>
										<span className="text-primary">{jobNumber ?? "—"}</span>
									</div>
									<div className="flex gap-3">
										<span className="text-muted-foreground w-16 shrink-0">Client</span>
										<span className="text-primary">{clientName ?? "—"}</span>
									</div>
									<div className="flex gap-3">
										<span className="text-muted-foreground w-16 shrink-0">Phone</span>
										<span className="text-primary">{clientPhone ?? "—"}</span>
									</div>
									<div className="flex gap-3">
										<span className="text-muted-foreground w-16 shrink-0">Address</span>
										<span className="text-primary">{clientAddress ?? "—"}</span>
									</div>
								</div>
							</div>
						</div>

						<div className="border-t" />

						{/* Bottom section — Schedule + Team */}
						<div className="grid grid-cols-[1fr_280px] gap-6">
							{/* Left — Schedule */}
							<div>
								<h3 className="text-lg font-semibold mb-4">Schedule</h3>
								<div className="grid grid-cols-3 gap-4">
									<div className="space-y-2">
										<Label className="text-sm font-semibold">Start date</Label>
										<Input type="date" {...register("startDate")} disabled={scheduleLater} />
									</div>
									<div className="space-y-2">
										<Label className="text-sm font-semibold">End date</Label>
										<Input type="date" {...register("endDate")} disabled={scheduleLater} />
									</div>
									<div className="space-y-2">
										<Label className="text-sm font-semibold">Times</Label>
										<div className="grid grid-cols-2 gap-2">
											<Input type="time" placeholder="Start time" {...register("startTime")} disabled={scheduleLater || allDay} />
											<Input type="time" placeholder="End time" {...register("endTime")} disabled={scheduleLater || allDay} />
										</div>
									</div>
								</div>
								<div className="flex items-center gap-6 mt-3">
									<label className="flex items-center gap-2 text-sm cursor-pointer">
										<Checkbox
											checked={scheduleLater}
											onCheckedChange={(checked) => setValue("scheduleLater", !!checked)}
										/>
										Schedule later
									</label>
									<label className="flex items-center gap-2 text-sm cursor-pointer">
										<Checkbox
											checked={allDay}
											onCheckedChange={(checked) => setValue("allDay", !!checked)}
										/>
										All day
									</label>
								</div>
							</div>

							{/* Right — Team */}
							<div>
								<div className="flex items-center justify-between mb-4">
									<h3 className="text-lg font-semibold">Team</h3>
									<Button type="button" variant="outline" size="sm">
										<Plus className="h-3 w-3 mr-1" />
										Assign
									</Button>
								</div>
								<div className="space-y-3">
									{assignees.length === 0 ? (
										<p className="text-sm text-muted-foreground">No team members assigned</p>
									) : (
										<div className="flex flex-wrap gap-2">
											{assignees.map((name, i) => (
												<Badge key={i} variant="secondary" className="gap-1 pl-3 pr-1.5 py-1">
													{name}
													<button
														type="button"
														onClick={() => setValue("assignedUserIds", assignees.filter((_, idx) => idx !== i))}
														className="hover:text-destructive"
													>
														<X className="h-3 w-3" />
													</button>
												</Badge>
											))}
										</div>
									)}
									<label className="flex items-center gap-2 text-sm cursor-pointer">
										<Checkbox
											checked={watch("emailTeam")}
											onCheckedChange={(checked) => setValue("emailTeam", !!checked)}
										/>
										Email team about assignment
									</label>
								</div>
							</div>
						</div>
					</div>

					<DialogFooter>
						<Button type="button" variant="outline" onClick={() => { reset(defaultValues); onOpenChange(false); }}>
							Cancel
						</Button>
						<Button type="submit" disabled={mutation.isPending}>
							{mutation.isPending ? "Saving..." : "Save"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
};

export default InvoiceReminderDialog;
