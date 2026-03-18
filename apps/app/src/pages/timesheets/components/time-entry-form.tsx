import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { createTimesheetEntry, updateTimesheetEntry } from "../api";
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

export interface TimeEntryValues {
	id?: string;
	type: string;
	date: string;
	startTime: string;
	endTime: string;
	notes: string;
}

interface TimeEntryFormProps {
	date: string;
	initialValues?: TimeEntryValues;
	onCancel: () => void;
	onSaved: () => void;
	onDelete?: () => void;
}

const computeDuration = (start: string, end: string) => {
	if (!start || !end) return 0;
	const [sh, sm] = start.split(":").map(Number);
	const [eh, em] = end.split(":").map(Number);
	const diff = (eh * 60 + em) - (sh * 60 + sm);
	return diff > 0 ? diff : 0;
};

const formatDuration = (minutes: number) =>
	`${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, "0")}`;

const TimeEntryForm = ({ date, initialValues, onCancel, onSaved, onDelete }: TimeEntryFormProps) => {
	const isEditing = !!initialValues?.id;
	const [category, setCategory] = useState(initialValues?.type ?? "general");
	const [startTime, setStartTime] = useState(initialValues?.startTime ?? "");
	const [endTime, setEndTime] = useState(initialValues?.endTime ?? "");
	const [notes, setNotes] = useState(initialValues?.notes ?? "");

	const durationMinutes = computeDuration(startTime, endTime);

	const createMutation = useMutation({
		mutationFn: createTimesheetEntry,
		onSuccess: () => onSaved(),
	});

	const updateMutation = useMutation({
		mutationFn: (data: Parameters<typeof updateTimesheetEntry>[1]) =>
			updateTimesheetEntry(initialValues!.id!, data),
		onSuccess: () => onSaved(),
	});

	const handleSave = () => {
		const data = {
			category: category as "general" | "job" | "break",
			date: initialValues?.date ?? date,
			startTime: startTime || undefined,
			endTime: endTime || undefined,
			durationMinutes,
			notes: notes || undefined,
		};

		if (isEditing) {
			updateMutation.mutate(data);
		} else {
			createMutation.mutate(data);
		}
	};

	const saving = createMutation.isPending || updateMutation.isPending;

	return (
		<div className="p-4 space-y-3 border-b bg-muted/20">
			<div className="flex items-end gap-3">
				<div className="space-y-1 w-48">
					<Label className="text-xs text-muted-foreground">Category</Label>
					<Select value={category} onValueChange={setCategory}>
						<SelectTrigger>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="general">General</SelectItem>
							<SelectItem value="job">Job</SelectItem>
							<SelectItem value="break">Break</SelectItem>
						</SelectContent>
					</Select>
				</div>
				<div className="space-y-1 w-32">
					<Label className="text-xs text-muted-foreground">Start</Label>
					<Input
						type="time"
						value={startTime}
						onChange={(e) => setStartTime(e.target.value)}
					/>
				</div>
				<div className="space-y-1 w-32">
					<Label className="text-xs text-muted-foreground">End</Label>
					<Input
						type="time"
						value={endTime}
						onChange={(e) => setEndTime(e.target.value)}
					/>
				</div>
				<div className="space-y-1 w-28">
					<Label className="text-xs text-muted-foreground">Duration</Label>
					<div className="flex items-center h-9 px-3 text-sm border rounded-md bg-background">
						{formatDuration(durationMinutes)}
					</div>
				</div>
				<div className="flex flex-col gap-1">
					<Button size="sm" onClick={handleSave} disabled={saving}>
						{saving ? "Saving..." : isEditing ? "Save" : "Start"}
					</Button>
					<Button variant="outline" size="sm" onClick={onCancel} disabled={saving}>Cancel</Button>
				</div>
			</div>
			<div className="flex items-start gap-3">
				<div className="max-w-sm flex-1">
					<Textarea
						placeholder="Notes"
						rows={3}
						value={notes}
						onChange={(e) => setNotes(e.target.value)}
					/>
				</div>
				{isEditing && onDelete && (
					<Button variant="destructive" size="sm" onClick={onDelete}>
						Delete
					</Button>
				)}
			</div>
		</div>
	);
};

export default TimeEntryForm;
