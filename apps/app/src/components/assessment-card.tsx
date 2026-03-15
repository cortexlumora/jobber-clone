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

export interface AssessmentData {
	instructions: string;
	startDate: string;
	endDate: string;
	startTime: string;
	endTime: string;
	scheduleLater: boolean;
	anytime: boolean;
	teamReminder: "none" | "at_start" | "30min" | "1hour" | "2hour" | "5hour" | "24hour";
}

interface AssessmentCardProps {
	value: AssessmentData;
	onChange: (value: AssessmentData) => void;
	onSave?: () => void;
	onCancel?: () => void;
	saving?: boolean;
	hideHeader?: boolean;
}

const REMINDER_OPTIONS = [
	{ value: "none", label: "No reminder set" },
	{ value: "at_start", label: "At start of task" },
	{ value: "30min", label: "30 minutes before" },
	{ value: "1hour", label: "1 hour before" },
	{ value: "2hour", label: "2 hours before" },
	{ value: "5hour", label: "5 hours before" },
	{ value: "24hour", label: "24 hours before" },
];

const AssessmentCard = ({ value, onChange, onSave, onCancel, saving, hideHeader }: AssessmentCardProps) => {
	const update = (updates: Partial<AssessmentData>) => {
		onChange({ ...value, ...updates });
	};

	const content = (
			<div className={hideHeader ? "space-y-4" : "px-2 pb-4 space-y-4"}>
				<div className="space-y-2">
					<Label>Instructions</Label>
					<Textarea
						placeholder="Add instructions for the assessment..."
						rows={3}
						value={value.instructions}
						onChange={(e) => update({ instructions: e.target.value })}
					/>
				</div>

				<div className="grid grid-cols-2 gap-6">
					{/* Left Column - Schedule */}
					<div className="space-y-4">
						<h4 className="text-sm font-semibold">Schedule</h4>
						<div className="grid grid-cols-2 gap-3">
							<div className="space-y-2">
								<Label>Start date</Label>
								<Input
									type="date"
									value={value.startDate}
									onChange={(e) => update({ startDate: e.target.value })}
								/>
							</div>
							<div className="space-y-2">
								<Label>End date</Label>
								<Input
									type="date"
									value={value.endDate}
									onChange={(e) => update({ endDate: e.target.value })}
								/>
							</div>
						</div>
						<div className="flex items-center gap-2">
							<Checkbox
								id="scheduleLater"
								checked={value.scheduleLater}
								onCheckedChange={(v) => update({ scheduleLater: !!v })}
							/>
							<Label htmlFor="scheduleLater" className="font-normal">Schedule later</Label>
						</div>
						<div className="grid grid-cols-2 gap-3">
							<div className="space-y-2">
								<Label>Start time</Label>
								<Input
									type="time"
									value={value.startTime}
									onChange={(e) => update({ startTime: e.target.value })}
								/>
							</div>
							<div className="space-y-2">
								<Label>End time</Label>
								<Input
									type="time"
									value={value.endTime}
									onChange={(e) => update({ endTime: e.target.value })}
								/>
							</div>
						</div>
						<div className="flex items-center gap-2">
							<Checkbox
								id="anytime"
								checked={value.anytime}
								onCheckedChange={(v) => update({ anytime: !!v })}
							/>
							<Label htmlFor="anytime" className="font-normal">Anytime</Label>
						</div>
					</div>

					{/* Right Column - Team */}
					<div className="space-y-4">
						<h4 className="text-sm font-semibold">Team</h4>
						<div className="space-y-2">
							<Label>Assign team</Label>
							<Select>
								<SelectTrigger>
									<SelectValue placeholder="Select team member" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="unassigned">Unassigned</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div className="flex items-center gap-2">
							<Checkbox id="emailOnAssign" />
							<Label htmlFor="emailOnAssign" className="font-normal">Email when team is assigned</Label>
						</div>

						<hr />

						<div className="space-y-2">
							<h4 className="text-sm font-semibold">Team reminder</h4>
							<Label>Remind team</Label>
							<Select
								value={value.teamReminder}
								onValueChange={(v) => update({ teamReminder: v as AssessmentData["teamReminder"] })}
							>
								<SelectTrigger>
									<SelectValue placeholder="No reminder set" />
								</SelectTrigger>
								<SelectContent>
									{REMINDER_OPTIONS.map((opt) => (
										<SelectItem key={opt.value} value={opt.value}>
											{opt.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>
				</div>

				{onSave && (
					<div className="sticky bottom-0 flex items-center gap-2 pt-4 pb-1 border-t bg-background">
						<Button size="sm" onClick={onSave} disabled={saving}>
							{saving ? "Saving..." : "Save"}
						</Button>
						{onCancel && (
							<Button variant="outline" size="sm" onClick={onCancel}>
								Cancel
							</Button>
						)}
					</div>
				)}
			</div>
	);

	if (hideHeader) return content;

	return (
		<div className="rounded-xl px-2 border bg-background">
			<div className="py-4 px-2">
				<h3 className="text-lg font-medium">On-site assessment</h3>
			</div>
			{content}
		</div>
	);
};

export default AssessmentCard;
