import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getTimesheetEntries, deleteTimesheetEntry } from "./api";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import TimeEntryForm from "./components/time-entry-form";

const MOCK_USER = { name: "Josue Gomez", email: "jgo@poolgenx.com", initials: "JG" };

const TYPE_LABELS: Record<string, string> = { general: "General", job: "Job", break: "Break" };

const formatTime12h = (time: string) => {
	const [h, m] = time.split(":").map(Number);
	const ampm = h >= 12 ? "PM" : "AM";
	const hour = h % 12 || 12;
	return `${hour}:${String(m).padStart(2, "0")}${ampm}`;
};

const formatMinutes = (mins: number) =>
	`${Math.floor(mins / 60)}:${String(mins % 60).padStart(2, "0")}`;

type ViewMode = "day" | "week";

const TimesheetsPage = () => {
	const queryClient = useQueryClient();
	const [viewMode, setViewMode] = useState<ViewMode>("day");
	const [currentDate, setCurrentDate] = useState(new Date().toISOString().slice(0, 10));
	const [showAddForm, setShowAddForm] = useState(false);
	const [editingId, setEditingId] = useState<string | null>(null);

	const { data: result } = useQuery({
		queryKey: ["timesheet-entries", currentDate],
		queryFn: () => getTimesheetEntries(currentDate),
	});

	const entries = result?.data ?? [];

	const deleteMutation = useMutation({
		mutationFn: deleteTimesheetEntry,
		onSuccess: () => queryClient.invalidateQueries({ queryKey: ["timesheet-entries", currentDate] }),
	});

	const totalMinutes = entries.reduce((sum, e) => sum + e.durationMinutes, 0);

	const navigateDate = (offset: number) => {
		const d = new Date(currentDate + "T00:00:00");
		d.setDate(d.getDate() + offset);
		setCurrentDate(d.toISOString().slice(0, 10));
	};

	const displayDate = new Date(currentDate + "T00:00:00").toLocaleDateString("en-US", {
		weekday: "long", month: "short", day: "numeric", year: "numeric",
	});

	return (
		<div className="max-w-4xl">
			<h1 className="text-3xl font-bold mb-6">Timesheets</h1>

			{/* User info */}
			<div className="flex items-center gap-3 mb-6 p-4 rounded-lg border">
				<Avatar>
					<AvatarFallback>{MOCK_USER.initials}</AvatarFallback>
				</Avatar>
				<div>
					<p className="font-medium">{MOCK_USER.name}</p>
					<p className="text-sm text-muted-foreground">{MOCK_USER.email}</p>
				</div>
			</div>

			{/* Day/Week toggle + navigation */}
			<div className="flex items-center gap-2 mb-6">
				<Button variant="outline" size="icon" className="h-8 w-8" onClick={() => navigateDate(-1)}>
					<ChevronLeft className="h-4 w-4" />
				</Button>
				<div className="flex items-center rounded-md border">
					<button
						type="button"
						className={`px-4 py-1.5 text-sm font-medium rounded-l-md transition-colors ${viewMode === "day" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
						onClick={() => setViewMode("day")}
					>
						Day
					</button>
					<button
						type="button"
						className={`px-4 py-1.5 text-sm font-medium rounded-r-md transition-colors ${viewMode === "week" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
						onClick={() => setViewMode("week")}
					>
						Week
					</button>
				</div>
				<Button variant="outline" size="icon" className="h-8 w-8" onClick={() => navigateDate(1)}>
					<ChevronRight className="h-4 w-4" />
				</Button>
				<Button variant="default" size="sm" onClick={() => setCurrentDate(new Date().toISOString().slice(0, 10))}>
					Today
				</Button>
				<Button variant="outline" size="icon" className="h-8 w-8">
					<Calendar className="h-4 w-4" />
				</Button>
				<span className="text-sm text-muted-foreground ml-2">{displayDate}</span>
			</div>

			{/* Time entries */}
			<div className="rounded-lg border">
				<div className="flex items-center justify-between p-4 border-b">
					<h2 className="text-lg font-semibold">My hours for today</h2>
					{!showAddForm && (
						<Button variant="outline" size="sm" onClick={() => { setShowAddForm(true); setEditingId(null); }}>+ Add Time</Button>
					)}
				</div>

				{showAddForm && (
					<TimeEntryForm
						date={currentDate}
						onCancel={() => setShowAddForm(false)}
						onSaved={() => {
							setShowAddForm(false);
							queryClient.invalidateQueries({ queryKey: ["timesheet-entries", currentDate] });
						}}
					/>
				)}

				<div className="divide-y">
					{entries.map((entry) =>
						editingId === entry.id ? (
							<TimeEntryForm
								key={entry.id}
								date={currentDate}
								initialValues={{
									id: entry.id,
									type: entry.category,
									date: entry.date,
									startTime: entry.startTime ?? "",
									endTime: entry.endTime ?? "",
									notes: entry.notes ?? "",
								}}
								onCancel={() => setEditingId(null)}
								onSaved={() => {
									setEditingId(null);
									queryClient.invalidateQueries({ queryKey: ["timesheet-entries", currentDate] });
								}}
								onDelete={() => {
									deleteMutation.mutate(entry.id);
									setEditingId(null);
								}}
							/>
						) : (
							<div key={entry.id} className="flex items-center justify-between px-4 py-3">
								<div className="flex items-center gap-6">
									<span className="text-sm font-medium w-20">{TYPE_LABELS[entry.category] ?? entry.category}</span>
									<div className="flex items-center gap-2 text-sm text-muted-foreground">
										{entry.startTime && <span>{formatTime12h(entry.startTime)}</span>}
										{entry.gpsStartCoords && (
											<span className="text-[10px] font-medium bg-muted px-1.5 py-0.5 rounded">GPS</span>
										)}
										{entry.endTime && <span>to {formatTime12h(entry.endTime)}</span>}
										{entry.gpsEndCoords && (
											<span className="text-[10px] font-medium bg-muted px-1.5 py-0.5 rounded">GPS</span>
										)}
									</div>
								</div>
								<div className="flex items-center gap-4">
									<span className="text-sm font-medium w-12 text-right">{formatMinutes(entry.durationMinutes)}</span>
									<div className="flex flex-col gap-1">
										<Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => { setEditingId(entry.id); setShowAddForm(false); }}>Edit</Button>
										<Button variant="outline" size="sm" className="h-7 text-xs text-destructive" onClick={() => deleteMutation.mutate(entry.id)}>Delete</Button>
									</div>
								</div>
							</div>
						),
					)}
					{entries.length === 0 && !showAddForm && (
						<div className="px-4 py-8 text-center text-sm text-muted-foreground">
							No time entries for this day
						</div>
					)}
				</div>
				<div className="flex justify-end px-4 py-3 border-t">
					<p className="text-sm font-semibold">Total Hours: {formatMinutes(totalMinutes)}</p>
				</div>
			</div>
		</div>
	);
};

export default TimesheetsPage;
