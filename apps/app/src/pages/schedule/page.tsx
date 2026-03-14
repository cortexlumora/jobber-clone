import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { getJobs } from "@/pages/jobs/api";
import { getRequests } from "@/pages/requests/api";
import { getClients } from "@/pages/clients/api";
import type { ClientDTO } from "@repo/dto";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
	ChevronLeft,
	ChevronRight,
	X,
	Info,
} from "lucide-react";
import { getInitials, formatTimeStr } from "@/lib/format";

// ── Types ────────────────────────────────────────────────────────────

interface CalendarEvent {
	id: string;
	title: string;
	clientName: string;
	date: string; // YYYY-MM-DD
	startTime: string | null;
	endTime: string | null;
	type: "job" | "request";
	color: string;
	assignee: string | null;
}

type ViewMode = "month" | "week" | "day";

// ── Helpers ──────────────────────────────────────────────────────────

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const HOURS = Array.from({ length: 17 }, (_, i) => i + 7); // 7 AM - 11 PM

function formatHour(hour: number) {
	if (hour === 0) return "12 AM";
	if (hour < 12) return `${hour} AM`;
	if (hour === 12) return "12 PM";
	return `${hour - 12} PM`;
}


function isSameDay(d1: Date, d2: Date) {
	return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
}

function getMonthDays(year: number, month: number) {
	const firstDay = new Date(year, month, 1);
	const lastDay = new Date(year, month + 1, 0);
	const days: Date[] = [];

	// Fill from start of week
	const startPad = firstDay.getDay();
	for (let i = startPad; i > 0; i--) {
		days.push(new Date(year, month, 1 - i));
	}

	// Fill month days
	for (let d = 1; d <= lastDay.getDate(); d++) {
		days.push(new Date(year, month, d));
	}

	// Fill to end of grid (6 rows)
	while (days.length < 42) {
		days.push(new Date(year, month + 1, days.length - startPad - lastDay.getDate() + 1));
	}

	return days;
}

function getWeekDays(date: Date) {
	const start = new Date(date);
	start.setDate(start.getDate() - start.getDay());
	return Array.from({ length: 7 }, (_, i) => {
		const d = new Date(start);
		d.setDate(d.getDate() + i);
		return d;
	});
}

function dateKey(d: Date) {
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function timeToRow(timeStr: string) {
	const [h, m] = timeStr.split(":").map(Number);
	return (h - 7) * 60 + m; // minutes from 7 AM
}

// ── Schedule Page ────────────────────────────────────────────────────

const SchedulePage = () => {
	const navigate = useNavigate();
	const today = useMemo(() => new Date(), []);
	const [currentDate, setCurrentDate] = useState(today);
	const [view, setView] = useState<ViewMode>("month");
	const [showUnscheduled, setShowUnscheduled] = useState(true);

	const { data: jobs = [] } = useQuery({ queryKey: ["jobs"], queryFn: getJobs });
	const { data: requests = [] } = useQuery({ queryKey: ["requests"], queryFn: getRequests });
	const { data: clients = [] } = useQuery({ queryKey: ["clients"], queryFn: getClients });

	const clientMap = useMemo(() => new Map(clients.map((c) => [c.id, c])), [clients]);

	const getClientName = (clientId: string) => {
		const c = clientMap.get(clientId);
		if (!c) return "";
		const title = c.title !== "none" ? `${c.title} ` : "";
		return c.useCompanyAsPrimary && c.companyName ? c.companyName : `${title}${c.firstName} ${c.lastName}`;
	};

	// Build events
	const { events, unscheduled } = useMemo(() => {
		const evts: CalendarEvent[] = [];
		const unsched: CalendarEvent[] = [];

		for (const job of jobs) {
			const evt: CalendarEvent = {
				id: job.id,
				title: job.title,
				clientName: getClientName(job.clientId),
				date: job.startDate ?? "",
				startTime: job.startTime,
				endTime: job.endTime,
				type: "job",
				color: "bg-green-600",
				assignee: job.salesperson,
			};
			if (job.startDate) evts.push(evt);
			else unsched.push(evt);
		}

		for (const req of requests) {
			if (req.assessmentStartDate) {
				evts.push({
					id: req.id,
					title: req.title,
					clientName: getClientName(req.clientId),
					date: req.assessmentStartDate,
					startTime: req.assessmentStartTime,
					endTime: req.assessmentEndTime,
					type: "request",
					color: "bg-blue-600",
					assignee: null,
				});
			}
		}

		return { events: evts, unscheduled: unsched };
	}, [jobs, requests, clientMap]);

	const eventsByDate = useMemo(() => {
		const map = new Map<string, CalendarEvent[]>();
		for (const evt of events) {
			const existing = map.get(evt.date) ?? [];
			existing.push(evt);
			map.set(evt.date, existing);
		}
		return map;
	}, [events]);

	// Navigation
	const goToday = () => setCurrentDate(new Date());
	const goPrev = () => {
		const d = new Date(currentDate);
		if (view === "month") d.setMonth(d.getMonth() - 1);
		else if (view === "week") d.setDate(d.getDate() - 7);
		else d.setDate(d.getDate() - 1);
		setCurrentDate(d);
	};
	const goNext = () => {
		const d = new Date(currentDate);
		if (view === "month") d.setMonth(d.getMonth() + 1);
		else if (view === "week") d.setDate(d.getDate() + 7);
		else d.setDate(d.getDate() + 1);
		setCurrentDate(d);
	};

	const monthLabel = currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });

	return (
		<div className="flex flex-col h-[calc(100vh-64px)]">
			{/* Header */}
			<div className="shrink-0 space-y-3 pb-3">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-3">
						<h2 className="text-2xl font-semibold">{monthLabel}</h2>
						<div className="flex items-center gap-1">
							<Button variant="outline" size="icon" className="h-8 w-8" onClick={goPrev}>
								<ChevronLeft className="h-4 w-4" />
							</Button>
							<Button variant="outline" size="icon" className="h-8 w-8" onClick={goNext}>
								<ChevronRight className="h-4 w-4" />
							</Button>
						</div>
						<Button variant="outline" size="sm" onClick={goToday}>Today</Button>
					</div>
					<div className="flex items-center gap-2">
						<div className="flex rounded-md border overflow-hidden">
							{(["month", "week", "day"] as ViewMode[]).map((v) => (
								<button
									key={v}
									className={`px-3 py-1.5 text-sm font-medium capitalize transition-colors ${
										view === v ? "bg-primary text-primary-foreground" : "hover:bg-muted"
									}`}
									onClick={() => setView(v)}
								>
									{v}
								</button>
							))}
						</div>
					</div>
				</div>

				{/* Filters + timezone */}
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<Badge variant="outline" className="font-normal">Type <span className="font-medium ml-1">All</span></Badge>
						<Badge variant="outline" className="font-normal">Team <span className="font-medium ml-1">All</span></Badge>
						<Badge variant="outline" className="font-normal">Status <span className="font-medium ml-1">All</span></Badge>
					</div>
					<div className="flex items-center gap-2 text-sm text-muted-foreground">
						<Info className="h-4 w-4" />
						Times shown are in your account's time zone ({Intl.DateTimeFormat().resolvedOptions().timeZone})
					</div>
				</div>
			</div>

			{/* Calendar + Sidebar */}
			<div className="flex flex-1 min-h-0 gap-0">
				{/* Calendar Area */}
				<div className="flex-1 min-w-0 border rounded-lg overflow-hidden flex flex-col">
					{view === "month" && (
						<MonthView
							currentDate={currentDate}
							today={today}
							eventsByDate={eventsByDate}
							onDateClick={(d) => { setCurrentDate(d); setView("day"); }}
							onEventClick={(evt) => navigate(`/${evt.type === "job" ? "jobs" : "requests"}/${evt.id}`)}
						/>
					)}
					{view === "week" && (
						<WeekView
							currentDate={currentDate}
							today={today}
							eventsByDate={eventsByDate}
							onEventClick={(evt) => navigate(`/${evt.type === "job" ? "jobs" : "requests"}/${evt.id}`)}
						/>
					)}
					{view === "day" && (
						<DayView
							currentDate={currentDate}
							today={today}
							events={eventsByDate.get(dateKey(currentDate)) ?? []}
							onEventClick={(evt) => navigate(`/${evt.type === "job" ? "jobs" : "requests"}/${evt.id}`)}
						/>
					)}
				</div>

				{/* Unscheduled Sidebar */}
				{showUnscheduled && (
					<div className="w-64 shrink-0 border rounded-lg ml-2 flex flex-col">
						<div className="flex items-center justify-between px-3 py-2 border-b">
							<div className="flex items-center gap-2">
								<span className="text-sm font-semibold">Unscheduled</span>
								<Badge variant="secondary" className="h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px]">
									{unscheduled.length}
								</Badge>
							</div>
							<button onClick={() => setShowUnscheduled(false)} className="text-muted-foreground hover:text-foreground">
								<X className="h-4 w-4" />
							</button>
						</div>
						<div className="flex-1 overflow-y-auto p-2 space-y-1.5">
							{unscheduled.length === 0 ? (
								<p className="text-xs text-muted-foreground p-2">No unscheduled items</p>
							) : (
								unscheduled.map((evt) => (
									<div
										key={evt.id}
										className="rounded-md bg-green-600 text-white px-2.5 py-1.5 text-xs cursor-pointer hover:opacity-90 flex items-center gap-2"
										onClick={() => navigate(`/jobs/${evt.id}`)}
									>
										<div className="h-5 w-5 rounded-full bg-white/20 flex items-center justify-center text-[9px] font-medium shrink-0">
											{getInitials(evt.clientName)}
										</div>
										<span className="truncate">{evt.clientName} - {evt.title}</span>
									</div>
								))
							)}
						</div>
					</div>
				)}
			</div>
		</div>
	);
};

// ── Month View ───────────────────────────────────────────────────────

function MonthView({
	currentDate,
	today,
	eventsByDate,
	onDateClick,
	onEventClick,
}: {
	currentDate: Date;
	today: Date;
	eventsByDate: Map<string, CalendarEvent[]>;
	onDateClick: (d: Date) => void;
	onEventClick: (evt: CalendarEvent) => void;
}) {
	const days = getMonthDays(currentDate.getFullYear(), currentDate.getMonth());

	return (
		<>
			{/* Day headers */}
			<div className="grid grid-cols-7 border-b">
				{DAYS.map((day, i) => {
					const isToday = day === DAYS[today.getDay()];
					return (
						<div
							key={day}
							className={`text-center py-2 text-xs font-medium ${
								isToday ? "text-primary font-semibold" : "text-muted-foreground"
							}`}
						>
							{day}
						</div>
					);
				})}
			</div>

			{/* Day cells */}
			<div className="grid grid-cols-7 flex-1 auto-rows-fr">
				{days.map((day, i) => {
					const isCurrentMonth = day.getMonth() === currentDate.getMonth();
					const isToday = isSameDay(day, today);
					const key = dateKey(day);
					const dayEvents = eventsByDate.get(key) ?? [];

					return (
						<div
							key={i}
							className={`border-b border-r p-1 min-h-[80px] cursor-pointer hover:bg-muted/30 transition-colors ${
								!isCurrentMonth ? "bg-muted/20" : ""
							}`}
							onClick={() => onDateClick(day)}
						>
							<span
								className={`inline-flex items-center justify-center text-xs font-medium h-6 w-6 rounded-full ${
									isToday ? "bg-primary text-primary-foreground" : !isCurrentMonth ? "text-muted-foreground" : ""
								}`}
							>
								{day.getDate()}
							</span>
							<div className="mt-0.5 space-y-0.5">
								{dayEvents.slice(0, 3).map((evt) => (
									<div
										key={evt.id}
										className={`${evt.color} text-white text-[10px] rounded px-1.5 py-0.5 truncate cursor-pointer hover:opacity-90 flex items-center gap-1`}
										onClick={(e) => { e.stopPropagation(); onEventClick(evt); }}
									>
										{evt.startTime && (
											<span className="font-medium">{formatTimeStr(evt.startTime)}</span>
										)}
										<span className="truncate">{evt.title}</span>
									</div>
								))}
								{dayEvents.length > 3 && (
									<p className="text-[10px] text-muted-foreground pl-1">+{dayEvents.length - 3} more</p>
								)}
							</div>
						</div>
					);
				})}
			</div>
		</>
	);
}

// ── Week View ────────────────────────────────────────────────────────

function WeekView({
	currentDate,
	today,
	eventsByDate,
	onEventClick,
}: {
	currentDate: Date;
	today: Date;
	eventsByDate: Map<string, CalendarEvent[]>;
	onEventClick: (evt: CalendarEvent) => void;
}) {
	const weekDays = getWeekDays(currentDate);

	return (
		<>
			{/* Day headers */}
			<div className="grid grid-cols-[60px_repeat(7,1fr)] border-b shrink-0">
				<div />
				{weekDays.map((day) => {
					const isToday = isSameDay(day, today);
					return (
						<div
							key={day.toISOString()}
							className={`text-center py-2 text-xs font-medium ${
								isToday ? "text-primary font-semibold" : "text-muted-foreground"
							}`}
						>
							{DAYS[day.getDay()]} {day.getDate()}
						</div>
					);
				})}
			</div>

			{/* Anytime row */}
			<div className="grid grid-cols-[60px_repeat(7,1fr)] border-b shrink-0">
				<div className="text-[10px] text-muted-foreground text-right pr-2 py-1">Anytime</div>
				{weekDays.map((day) => {
					const key = dateKey(day);
					const dayEvents = (eventsByDate.get(key) ?? []).filter((e) => !e.startTime);
					return (
						<div key={day.toISOString()} className="border-l p-0.5 min-h-[30px]">
							{dayEvents.map((evt) => (
								<div
									key={evt.id}
									className={`${evt.color} text-white text-[10px] rounded px-1.5 py-0.5 truncate cursor-pointer hover:opacity-90`}
									onClick={() => onEventClick(evt)}
								>
									{evt.title}
								</div>
							))}
						</div>
					);
				})}
			</div>

			{/* Time grid */}
			<div className="flex-1 overflow-y-auto">
				<div className="relative">
					{HOURS.map((hour) => (
						<div key={hour} className="grid grid-cols-[60px_repeat(7,1fr)] h-14 border-b">
							<div className="text-[10px] text-muted-foreground text-right pr-2 -mt-2">
								{formatHour(hour)}
							</div>
							{weekDays.map((day) => (
								<div key={day.toISOString()} className="border-l relative" />
							))}
						</div>
					))}

					{/* Overlay events */}
					{weekDays.map((day, dayIdx) => {
						const key = dateKey(day);
						const dayEvents = (eventsByDate.get(key) ?? []).filter((e) => e.startTime);
						return dayEvents.map((evt) => {
							if (!evt.startTime) return null;
							const top = timeToRow(evt.startTime);
							const endMinutes = evt.endTime ? timeToRow(evt.endTime) : top + 60;
							const height = Math.max(endMinutes - top, 30);
							const colWidth = `calc((100% - 60px) / 7)`;
							const left = `calc(60px + ${dayIdx} * ${colWidth})`;

							return (
								<div
									key={evt.id}
									className={`absolute ${evt.color} text-white text-[10px] rounded px-1.5 py-0.5 cursor-pointer hover:opacity-90 overflow-hidden z-10`}
									style={{
										top: `${(top / 60) * 56}px`,
										height: `${(height / 60) * 56}px`,
										left,
										width: colWidth,
									}}
									onClick={() => onEventClick(evt)}
								>
									<div className="flex items-center gap-1">
										<div className="h-4 w-4 rounded-full bg-white/20 flex items-center justify-center text-[8px] font-medium shrink-0">
											{getInitials(evt.clientName)}
										</div>
										<span className="truncate">{evt.title}</span>
									</div>
								</div>
							);
						});
					})}
				</div>
			</div>
		</>
	);
}

// ── Day View ─────────────────────────────────────────────────────────

function DayView({
	currentDate,
	today,
	events,
	onEventClick,
}: {
	currentDate: Date;
	today: Date;
	events: CalendarEvent[];
	onEventClick: (evt: CalendarEvent) => void;
}) {
	const isToday = isSameDay(currentDate, today);
	const dayLabel = `${DAYS[currentDate.getDay()]} ${currentDate.getDate()}`;

	// Group by assignee
	const assignees = useMemo(() => {
		const map = new Map<string, CalendarEvent[]>();
		map.set("Unassigned", []);
		for (const evt of events) {
			const key = evt.assignee ?? "Unassigned";
			if (!map.has(key)) map.set(key, []);
			map.get(key)!.push(evt);
		}
		// Put events without assignee in "Unassigned"
		return map;
	}, [events]);

	const anytimeEvents = events.filter((e) => !e.startTime);
	const timedEvents = events.filter((e) => e.startTime);

	return (
		<>
			{/* Day header */}
			<div className="text-center py-3 border-b shrink-0">
				<span className={`text-sm font-semibold ${isToday ? "text-primary" : ""}`}>
					{dayLabel}
				</span>
			</div>

			{/* Horizontal time grid */}
			<div className="flex-1 overflow-y-auto">
				{/* Assignee rows + time header */}
				<div className="min-w-full">
					{/* Time header row */}
					<div className="grid grid-cols-[200px_repeat(17,1fr)] border-b sticky top-0 bg-background z-10">
						<div className="text-[10px] text-muted-foreground text-center py-1 border-r">Anytime</div>
						{HOURS.map((hour) => (
							<div key={hour} className="text-[10px] text-muted-foreground text-center py-1 border-r">
								{formatHour(hour)}
							</div>
						))}
					</div>

					{/* Assignee rows */}
					{Array.from(assignees.entries()).map(([assignee, assigneeEvents]) => {
						const timedForAssignee = assigneeEvents.filter((e) => e.startTime);
						const anytimeForAssignee = assigneeEvents.filter((e) => !e.startTime);

						return (
							<div key={assignee} className="grid grid-cols-[200px_repeat(17,1fr)] border-b min-h-[80px]">
								{/* Assignee label */}
								<div className="border-r px-3 py-2 flex items-start gap-2">
									<div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-[9px] font-medium shrink-0 mt-0.5">
										{assignee === "Unassigned" ? "?" : getInitials(assignee)}
									</div>
									<div>
										<p className="text-xs font-medium">{assignee}</p>
										<p className="text-[10px] text-muted-foreground">{assigneeEvents.length}</p>
									</div>
								</div>

								{/* Anytime + Time slots */}
								{HOURS.map((hour, hIdx) => {
									if (hIdx === 0) {
										// Anytime column - first column
										return (
											<div key="anytime" className="border-r p-0.5 relative">
												{anytimeForAssignee.map((evt) => (
													<div
														key={evt.id}
														className={`${evt.color} text-white text-[9px] rounded px-1 py-0.5 truncate cursor-pointer hover:opacity-90 mb-0.5`}
														onClick={() => onEventClick(evt)}
													>
														{evt.title}
													</div>
												))}
											</div>
										);
									}

									// Find events that overlap this hour
									const hourEvents = timedForAssignee.filter((evt) => {
										if (!evt.startTime) return false;
										const startH = Number(evt.startTime.split(":")[0]);
										const endH = evt.endTime ? Number(evt.endTime.split(":")[0]) : startH + 1;
										return hour >= startH && hour < endH;
									});

									return (
										<div key={hour} className="border-r relative">
											{hourEvents.map((evt) => {
												const startH = Number(evt.startTime!.split(":")[0]);
												if (hour !== startH) return null; // Only render at start hour
												const endH = evt.endTime ? Number(evt.endTime.split(":")[0]) : startH + 1;
												const span = endH - startH;

												return (
													<div
														key={evt.id}
														className={`absolute inset-y-0 left-0 ${evt.color} text-white text-[9px] rounded m-0.5 px-1.5 py-0.5 cursor-pointer hover:opacity-90 overflow-hidden z-10`}
														style={{ width: `calc(${span * 100}% + ${(span - 1) * 1}px)` }}
														onClick={() => onEventClick(evt)}
													>
														<div className="flex items-center gap-1">
															<div className="h-4 w-4 rounded-full bg-white/20 flex items-center justify-center text-[8px] font-medium shrink-0">
																{getInitials(evt.clientName)}
															</div>
															<span className="truncate">{evt.clientName} - {evt.title}</span>
														</div>
													</div>
												);
											})}
										</div>
									);
								})}
							</div>
						);
					})}
				</div>
			</div>
		</>
	);
}

export default SchedulePage;
