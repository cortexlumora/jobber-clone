import { useForm, useWatch, Controller } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { createVisitSchema, type CreateVisitForm } from "@repo/zod/visit";
import { createVisit } from "@/pages/jobs/visits-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from "@/components/ui/dialog";

interface ScheduleVisitDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	jobId: string;
	assignedTo?: string | null;
}

const ScheduleVisitDialog = ({ open, onOpenChange, jobId, assignedTo }: ScheduleVisitDialogProps) => {
	const queryClient = useQueryClient();

	const mutation = useMutation({
		mutationFn: (data: CreateVisitForm) => createVisit(jobId, data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["job", jobId] });
			reset();
			onOpenChange(false);
		},
	});

	const {
		register,
		handleSubmit,
		control,
		reset,
		formState: { errors },
	} = useForm<CreateVisitForm>({
		resolver: zodResolver(createVisitSchema),
		defaultValues: {
			title: "",
			instructions: "",
			startDate: "",
			endDate: "",
			startTime: "",
			endTime: "",
			scheduleLater: false,
			anytime: false,
			assignedTo: assignedTo ?? "",
			emailOnAssign: false,
			teamReminder: "none",
		},
	});

	const scheduleLater = useWatch({ control, name: "scheduleLater" });
	const anytime = useWatch({ control, name: "anytime" });

	const onSubmit = (data: CreateVisitForm) => {
		mutation.mutate(data);
	};

	return (
		<Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
			<DialogContent className="max-w-lg">
				<DialogHeader>
					<DialogTitle>Schedule a Visit</DialogTitle>
				</DialogHeader>
				<form onSubmit={handleSubmit(onSubmit)}>
					<div className="space-y-5 py-4">
						{/* Visit Title */}
						<div className="space-y-2">
							<Label>Visit title</Label>
							<Input placeholder="e.g. Initial inspection" {...register("title")} />
							{errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
						</div>

						{/* Instructions */}
						<div className="space-y-2">
							<Label>Instructions</Label>
							<Textarea placeholder="Add visit instructions..." rows={3} {...register("instructions")} />
						</div>

						{/* Visit Schedule */}
						<div className="space-y-3">
							<h4 className="text-sm font-semibold">Visit schedule</h4>
							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label>Start date</Label>
									<Input type="date" disabled={scheduleLater} {...register("startDate")} />
								</div>
								<div className="space-y-2">
									<Label>End date</Label>
									<Input type="date" disabled={scheduleLater} {...register("endDate")} />
								</div>
							</div>
							<Controller
								control={control}
								name="scheduleLater"
								render={({ field }) => (
									<div className="flex items-center gap-2">
										<Checkbox id="scheduleLater" checked={field.value} onCheckedChange={field.onChange} />
										<Label htmlFor="scheduleLater" className="font-normal">Schedule later</Label>
									</div>
								)}
							/>
							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label>Start time</Label>
									<Input type="time" disabled={scheduleLater || anytime} {...register("startTime")} />
								</div>
								<div className="space-y-2">
									<Label>End time</Label>
									<Input type="time" disabled={scheduleLater || anytime} {...register("endTime")} />
								</div>
							</div>
							<Controller
								control={control}
								name="anytime"
								render={({ field }) => (
									<div className="flex items-center gap-2">
										<Checkbox id="anytime" checked={field.value} onCheckedChange={field.onChange} disabled={scheduleLater} />
										<Label htmlFor="anytime" className="font-normal">Any time</Label>
									</div>
								)}
							/>
						</div>

						{/* Team */}
						<div className="space-y-3">
							<div className="space-y-2">
								<Label>Assigned to</Label>
								<Input placeholder="Select team member" {...register("assignedTo")} readOnly />
							</div>
							<Controller
								control={control}
								name="emailOnAssign"
								render={({ field }) => (
									<div className="flex items-center gap-2">
										<Checkbox id="emailOnAssign" checked={field.value} onCheckedChange={field.onChange} />
										<Label htmlFor="emailOnAssign" className="font-normal">Email team about assignment</Label>
									</div>
								)}
							/>
						</div>

						{/* Team Reminder */}
						<div className="space-y-2">
							<Label>Team reminder</Label>
							<Controller
								control={control}
								name="teamReminder"
								render={({ field }) => (
									<Select value={field.value} onValueChange={field.onChange}>
										<SelectTrigger>
											<SelectValue placeholder="No reminder set" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="none">No reminder set</SelectItem>
											<SelectItem value="at_start">At start of visit</SelectItem>
											<SelectItem value="30min">30 minutes before</SelectItem>
											<SelectItem value="1hour">1 hour before</SelectItem>
											<SelectItem value="2hour">2 hours before</SelectItem>
											<SelectItem value="5hour">5 hours before</SelectItem>
											<SelectItem value="24hour">24 hours before</SelectItem>
										</SelectContent>
									</Select>
								)}
							/>
						</div>
					</div>
					<DialogFooter>
						<Button type="button" variant="outline" onClick={() => { reset(); onOpenChange(false); }}>
							Cancel
						</Button>
						<Button type="submit" disabled={mutation.isPending}>
							{mutation.isPending ? "Scheduling..." : "Schedule Visit"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
};

export default ScheduleVisitDialog;
