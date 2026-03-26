import { useMemo } from "react";
import { useFormContext, useWatch, Controller } from "react-hook-form";
import type { CreateJobForm } from "@repo/zod/job";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Calendar } from "lucide-react";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAY_LABELS: Record<string, string> = {
	Sun: "Sundays", Mon: "Mondays", Tue: "Tuesdays", Wed: "Wednesdays",
	Thu: "Thursdays", Fri: "Fridays", Sat: "Saturdays",
};

const ordinalSuffix = (n: number) => {
	if (n > 3 && n < 21) return "th";
	const r = n % 10;
	return r === 1 ? "st" : r === 2 ? "nd" : r === 3 ? "rd" : "th";
};

const formatDisplayDate = (dateStr: string) => {
	if (!dateStr) return "";
	const d = new Date(dateStr + "T00:00:00");
	return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const ScheduleCard = () => {
	const { register, control, setValue } = useFormContext<CreateJobForm>();

	const jobType = useWatch({ control, name: "jobType" });
	const startDate = useWatch({ control, name: "startDate" });
	const scheduleLater = useWatch({ control, name: "scheduleLater" });
	const anytime = useWatch({ control, name: "anytime" });
	const repeats = useWatch({ control, name: "repeats" });
	const repeatDay = useWatch({ control, name: "repeatDay" });
	const endsType = useWatch({ control, name: "endsType" });
	const endsAfterValue = useWatch({ control, name: "endsAfterValue" });
	const endsAfterUnit = useWatch({ control, name: "endsAfterUnit" });
	const endsOnDate = useWatch({ control, name: "endsOnDate" });

	// Derived date labels
	const startDateObj = startDate ? new Date(startDate + "T00:00:00") : new Date();
	const startDayName = DAYS[startDateObj.getDay()];
	const startDayOfMonth = startDateObj.getDate();
	const weeklyLabel = `Weekly on ${DAY_LABELS[startDayName]}`;
	const biweeklyLabel = `Every 2 weeks on ${DAY_LABELS[startDayName]}`;
	const monthlyLabel = `Monthly on the ${startDayOfMonth}${ordinalSuffix(startDayOfMonth)}`;

	const repeatsLabel = repeats === "does_not_repeat" ? "Does not repeat"
		: repeats === "daily" ? "Daily"
		: repeats === "weekly" ? weeklyLabel
		: repeats === "biweekly" ? biweeklyLabel
		: repeats === "monthly" ? monthlyLabel
		: repeats === "as_needed" ? "As needed - we won't prompt you"
		: repeats === "custom" ? "Custom schedule..."
		: "Does not repeat";

	// Ends after → approximate days
	const endsAfterDays = useMemo(() => {
		const val = Number(endsAfterValue) || 0;
		if (endsAfterUnit === "visits") return val * (repeats === "weekly" ? 7 : repeats === "biweekly" ? 14 : 30);
		if (endsAfterUnit === "months") return val * 30;
		if (endsAfterUnit === "years") return val * 365;
		return val * 7;
	}, [endsAfterValue, endsAfterUnit, repeats]);

	const totalVisits = useMemo(() => {
		if (jobType !== "recurring") return 1;
		const durationDays = endsType === "on" && endsOnDate && startDate
			? Math.ceil((new Date(endsOnDate).getTime() - new Date(startDate).getTime()) / 86400000)
			: endsAfterDays;
		if (durationDays <= 0) return 0;
		if (repeats === "weekly") return Math.ceil(durationDays / 7);
		if (repeats === "biweekly") return Math.ceil(durationDays / 14);
		if (repeats === "monthly") return Math.ceil(durationDays / 30);
		return Math.ceil(durationDays / 7);
	}, [jobType, endsType, endsOnDate, startDate, endsAfterDays, repeats]);

	const lastDate = useMemo(() => {
		if (jobType !== "recurring" || !startDate) return "";
		if (endsType === "on") return endsOnDate ?? "";
		const end = new Date(new Date(startDate).getTime() + endsAfterDays * 86400000);
		return end.toISOString().slice(0, 10);
	}, [jobType, startDate, endsType, endsOnDate, endsAfterDays]);

	return (
		<Card>
			<CardHeader className="pb-3 space-y-4">
				<div className="flex items-center justify-between">
					<CardTitle className="text-lg font-medium">Schedule</CardTitle>
					<Button type="button" variant="outline" size="sm">
						<Calendar className="h-4 w-4 mr-1" />
						Show Calendar
					</Button>
				</div>
				{/* Job Type */}
				<div className="space-y-2">
					<Label>Job type</Label>
					<Controller
						control={control}
						name="jobType"
						render={({ field }) => (
							<div className="flex items-center rounded-md border w-fit">
								<button
									type="button"
									className={`px-4 py-2 text-sm font-medium rounded-l-md transition-colors ${field.value === "one_off" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
									onClick={() => field.onChange("one_off")}
								>
									One-off
								</button>
								<button
									type="button"
									className={`px-4 py-2 text-sm font-medium rounded-r-md transition-colors ${field.value === "recurring" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
									onClick={() => field.onChange("recurring")}
								>
									Recurring
								</button>
							</div>
						)}
					/>
				</div>
			</CardHeader>
			<CardContent className="space-y-4">
				{/* Visit summary */}
				<div className="flex items-center gap-3 text-sm flex-wrap">
					<div>
						<span className="text-muted-foreground">Total visits </span>
						<span className="font-semibold">{totalVisits}</span>
					</div>
					<span className="text-muted-foreground">|</span>
					{jobType === "one_off" ? (
						<div>
							<span className="text-muted-foreground">On </span>
							<span className="font-semibold">{formatDisplayDate(startDate ?? "")}</span>
						</div>
					) : (
						<>
							<div>
								<span className="text-muted-foreground">First </span>
								<span className="font-semibold">{formatDisplayDate(startDate ?? "")}</span>
							</div>
							{lastDate && (
								<>
									<div>
										<span className="text-muted-foreground">Last </span>
										<span className="font-semibold">{formatDisplayDate(lastDate)}</span>
									</div>
									<span className="text-muted-foreground">|</span>
								</>
							)}
							<div>
								<span className="text-muted-foreground">Repeats </span>
								<span className="font-semibold">{repeats} on {repeatDay}</span>
							</div>
						</>
					)}
				</div>

				{/* Date, Time & Assign row */}
				<div className="grid grid-cols-[1fr_auto_1fr] gap-4">
					<div className="space-y-2">
						<Label className="text-xs text-muted-foreground">Start date</Label>
						<Input
							type="date"
							{...register("startDate")}
							disabled={!!scheduleLater}
						/>
					</div>
					<div className="space-y-2">
						<div className="grid grid-cols-2">
							<Label className="text-xs text-muted-foreground">Start time</Label>
							<Label className="text-xs text-muted-foreground">End time</Label>
						</div>
						<div className="flex">
							<Input
								type="time"
								{...register("startTime")}
								className="rounded-r-none border-r-0"
								disabled={!!anytime || !!scheduleLater}
							/>
							<Input
								type="time"
								{...register("endTime")}
								className="rounded-l-none"
								disabled={!!anytime || !!scheduleLater}
							/>
						</div>
					</div>
					<div className="space-y-2">
						<Label className="text-xs text-muted-foreground">Assign</Label>
						<Select>
							<SelectTrigger>
								<SelectValue placeholder="Assign" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="unassigned">Unassigned</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</div>

				{/* Checkboxes row */}
				<div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-start">
					<div className="flex items-center gap-6">
						<Controller
							control={control}
							name="scheduleLater"
							render={({ field }) => (
								<label className="flex items-center gap-2 text-sm cursor-pointer">
									<Checkbox checked={!!field.value} onCheckedChange={field.onChange} />
									Schedule later
								</label>
							)}
						/>
						<Controller
							control={control}
							name="anytime"
							render={({ field }) => (
								<label className="flex items-center gap-2 text-sm cursor-pointer">
									<Checkbox checked={!!field.value} onCheckedChange={field.onChange} disabled={!!scheduleLater} />
									Anytime
								</label>
							)}
						/>
					</div>
					<div />
					{jobType === "recurring" && (
						<Controller
							control={control}
							name="emailTeamAboutAssignment"
							render={({ field }) => (
								<label className="flex items-center gap-2 text-sm cursor-pointer">
									<Checkbox checked={!!field.value} onCheckedChange={field.onChange} />
									Email team about assignment
								</label>
							)}
						/>
					)}
				</div>

				{/* Repeats dropdown */}
				<div className="space-y-2">
					<Label className="text-xs text-muted-foreground">Repeats</Label>
					<Controller
						control={control}
						name="repeats"
						render={({ field }) => (
							<Select
								value={field.value ?? "does_not_repeat"}
								onValueChange={(val) => {
									if (val === "does_not_repeat") {
										setValue("jobType", "one_off");
										field.onChange("does_not_repeat");
									} else {
										if (jobType === "one_off") setValue("jobType", "recurring");
										field.onChange(val);
										if (val === "weekly" || val === "biweekly") setValue("repeatDay", startDayName);
									}
								}}
							>
								<SelectTrigger>
									<SelectValue>{repeatsLabel}</SelectValue>
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="does_not_repeat">Does not repeat</SelectItem>
									<SelectItem value="daily">Daily</SelectItem>
									<SelectItem value="weekly">{weeklyLabel}</SelectItem>
									<SelectItem value="biweekly">{biweeklyLabel}</SelectItem>
									<SelectItem value="monthly">{monthlyLabel}</SelectItem>
									<SelectItem value="as_needed">As needed - we won&apos;t prompt you</SelectItem>
									<SelectItem value="custom" disabled>Custom schedule...</SelectItem>
								</SelectContent>
							</Select>
						)}
					/>
				</div>

				{/* Ends after / Ends on (recurring only) */}
				{jobType === "recurring" && (
					<Controller
						control={control}
						name="endsType"
						render={({ field: endsTypeField }) => (
							<div className="space-y-4">
								{/* Ends after */}
								<div className="space-y-2">
									<label className="flex items-center gap-2 cursor-pointer">
										<input
											type="radio"
											name="endsType"
											checked={endsTypeField.value === "after"}
											onChange={() => endsTypeField.onChange("after")}
										/>
										<span className="text-sm font-medium">Ends after</span>
									</label>
									<div className="grid grid-cols-2 gap-3 pl-6">
										<div className="space-y-1">
											<Label className="text-xs text-muted-foreground">Ends after</Label>
											<Input
												type="number"
												min={1}
												{...register("endsAfterValue")}
												disabled={endsTypeField.value !== "after"}
											/>
										</div>
										<div className="space-y-1">
											<Label className="text-xs text-muted-foreground">&nbsp;</Label>
											<Controller
												control={control}
												name="endsAfterUnit"
												render={({ field }) => (
													<Select value={field.value ?? "months"} onValueChange={field.onChange} disabled={endsTypeField.value !== "after"}>
														<SelectTrigger>
															<SelectValue />
														</SelectTrigger>
														<SelectContent>
															<SelectItem value="visits">Visits</SelectItem>
															<SelectItem value="weeks">Weeks</SelectItem>
															<SelectItem value="months">Months</SelectItem>
															<SelectItem value="years">Years</SelectItem>
														</SelectContent>
													</Select>
												)}
											/>
										</div>
									</div>
								</div>

								{/* Ends on */}
								<div className="space-y-2">
									<label className="flex items-center gap-2 cursor-pointer">
										<input
											type="radio"
											name="endsType"
											checked={endsTypeField.value === "on"}
											onChange={() => endsTypeField.onChange("on")}
										/>
										<span className="text-sm font-medium">Ends on</span>
									</label>
									<div className="pl-6">
										<div className="space-y-1">
											<Label className="text-xs text-muted-foreground">Ends on</Label>
											<Input
												type="date"
												{...register("endsOnDate")}
												disabled={endsTypeField.value !== "on"}
											/>
										</div>
									</div>
								</div>
							</div>
						)}
					/>
				)}

				{/* Visit instructions */}
				<div className="space-y-2">
					<Textarea
						placeholder="Visit instructions"
						rows={3}
						{...register("visitInstructions")}
					/>
				</div>
			</CardContent>
		</Card>
	);
};

export default ScheduleCard;
