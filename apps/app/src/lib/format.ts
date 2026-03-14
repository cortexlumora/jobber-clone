import { format, parse } from "date-fns";

/** "Mar 14, 2026" */
export function formatDate(date: Date | string) {
	return format(new Date(date), "MMM d, yyyy");
}

/** "Mar 14, 2026 3:30 PM" */
export function formatDateTime(date: Date | string) {
	return format(new Date(date), "MMM d, yyyy h:mm a");
}

/** "3:30 PM" */
export function formatTime(date: Date | string) {
	return format(new Date(date), "h:mm a");
}

/** Converts "HH:mm" string to "3:30 PM" */
export function formatTimeStr(timeStr: string) {
	return format(parse(timeStr, "HH:mm", new Date()), "h:mm a");
}

/** "Mar 14, 2026 @ 3:30 PM" — for assessment dates with optional time */
export function formatAssessmentDate(dateStr: string, timeStr: string | null) {
	const formatted = format(new Date(dateStr + "T00:00:00"), "MMM d, yyyy");
	if (timeStr) return `${formatted} @ ${formatTimeStr(timeStr)}`;
	return formatted;
}

/** "Mar 14, 2026 3:30 PM – 5:00 PM" — for schedule date ranges */
export function formatScheduleDate(dateStr: string, startTime: string | null, endTime: string | null) {
	const parts = [format(new Date(dateStr + "T00:00:00"), "MMM d, yyyy")];
	if (startTime) parts.push(formatTimeStr(startTime));
	if (endTime) parts.push("– " + formatTimeStr(endTime));
	return parts.join(" ");
}

/** "$1,234.56" */
export function formatCurrency(amount: number) {
	return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}

/** "JD" from "John Doe" */
export function getInitials(name: string) {
	return name
		.split(" ")
		.map((n) => n[0])
		.join("")
		.slice(0, 2)
		.toUpperCase();
}
