import { useEffect } from "react";
import { useForm, useWatch, type Resolver } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { createTimeEntrySchema, type CreateTimeEntryForm } from "@repo/zod/time-entry";
import type { TimeEntryDTO } from "@repo/dto";
import { createTimeEntry, updateTimeEntry } from "@/pages/jobs/time-entries-api";
import { formatCurrency } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from "@/components/ui/dialog";

interface TimeEntryDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	jobId: string;
	timeEntry?: TimeEntryDTO | null;
}

const defaultValues: CreateTimeEntryForm = {
	startTime: "",
	endTime: "",
	hours: 0,
	minutes: 0,
	notes: "",
	date: new Date().toISOString().slice(0, 10),
	employee: "",
	employeeCostPerHour: 0,
};

const TimeEntryDialog = ({ open, onOpenChange, jobId, timeEntry }: TimeEntryDialogProps) => {
	const queryClient = useQueryClient();
	const isEditing = !!timeEntry;

	const mutation = useMutation({
		mutationFn: (data: CreateTimeEntryForm) =>
			isEditing ? updateTimeEntry(jobId, timeEntry.id, data) : createTimeEntry(jobId, data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["job", jobId] });
			queryClient.invalidateQueries({ queryKey: ["job-time-entries", jobId] });
			reset(defaultValues);
			onOpenChange(false);
		},
	});

	const {
		register,
		handleSubmit,
		control,
		reset,
		formState: { errors },
	} = useForm<CreateTimeEntryForm>({
		resolver: zodResolver(createTimeEntrySchema) as unknown as Resolver<CreateTimeEntryForm>,
		defaultValues,
	});

	useEffect(() => {
		if (open && timeEntry) {
			reset({
				startTime: timeEntry.startTime ?? "",
				endTime: timeEntry.endTime ?? "",
				hours: Math.floor(timeEntry.durationMinutes / 60),
				minutes: timeEntry.durationMinutes % 60,
				notes: timeEntry.notes ?? "",
				date: timeEntry.date,
				employee: timeEntry.employee,
				employeeCostPerHour: Number(timeEntry.employeeCostPerHour),
			});
		} else if (open) {
			reset(defaultValues);
		}
	}, [open, timeEntry, reset]);

	const hours = useWatch({ control, name: "hours" });
	const minutes = useWatch({ control, name: "minutes" });
	const costPerHour = useWatch({ control, name: "employeeCostPerHour" });

	const totalMinutes = (Number(hours) || 0) * 60 + (Number(minutes) || 0);
	const totalCost = (totalMinutes / 60) * (Number(costPerHour) || 0);

	const onSubmit = (data: CreateTimeEntryForm) => {
		mutation.mutate(data);
	};

	return (
		<Dialog open={open} onOpenChange={(v) => { if (!v) reset(defaultValues); onOpenChange(v); }}>
			<DialogContent className="max-w-lg">
				<DialogHeader>
					<DialogTitle>{isEditing ? "Edit Time Entry" : "New Time Entry"}</DialogTitle>
				</DialogHeader>
				<form onSubmit={handleSubmit(onSubmit)}>
					<div className="space-y-5 py-4">
						<div className="space-y-2">
							<Label>Employee</Label>
							<Input placeholder="Employee name" {...register("employee")} />
							{errors.employee && <p className="text-sm text-destructive">{errors.employee.message}</p>}
						</div>

						<div className="space-y-2">
							<Label>Date</Label>
							<Input type="date" {...register("date")} />
							{errors.date && <p className="text-sm text-destructive">{errors.date.message}</p>}
						</div>

						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label>Start time</Label>
								<Input type="time" {...register("startTime")} />
							</div>
							<div className="space-y-2">
								<Label>End time</Label>
								<Input type="time" {...register("endTime")} />
							</div>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label>Hours</Label>
								<Input type="number" min={0} {...register("hours")} />
							</div>
							<div className="space-y-2">
								<Label>Minutes</Label>
								<Input type="number" min={0} max={59} {...register("minutes")} />
							</div>
						</div>

						<div className="space-y-2">
							<Label>Employee cost ($/ hr)</Label>
							<Input type="number" min={0} step="0.01" {...register("employeeCostPerHour")} />
							<p className="text-xs text-muted-foreground">Total cost: {formatCurrency(totalCost)}</p>
						</div>

						<div className="space-y-2">
							<Label>Notes</Label>
							<Textarea placeholder="Add notes..." rows={3} {...register("notes")} />
						</div>
					</div>
					<DialogFooter>
						<Button type="button" variant="outline" onClick={() => { reset(defaultValues); onOpenChange(false); }}>
							Cancel
						</Button>
						<Button type="submit" disabled={mutation.isPending}>
							{mutation.isPending ? "Saving..." : isEditing ? "Update Time Entry" : "Save Time Entry"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
};

export default TimeEntryDialog;
