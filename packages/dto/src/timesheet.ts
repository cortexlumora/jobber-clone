export interface TimesheetEntryDTO {
	id: string;
	userId: string;
	jobId: string | null;
	category: "general" | "job" | "break";
	date: string;
	startTime: string | null;
	endTime: string | null;
	durationMinutes: number;
	notes: string | null;
	gpsStartCoords: string | null;
	gpsEndCoords: string | null;
	status: "pending" | "approved" | "rejected";
	approvedAt: Date | null;
	approvedById: string | null;
	createdAt: Date;
	updatedAt: Date;
	// Joined
	userName?: string;
	jobTitle?: string;
}

export interface TimesheetApprovalSummaryDTO {
	userId: string;
	userName: string;
	userInitials: string;
	totalMinutes: number;
	entries: {
		date: string;
		dayOfWeek: string;
		minutes: number;
	}[];
}

export interface PayrollPeriodDTO {
	id: string;
	userId: string;
	userName: string;
	userInitials: string;
	periodStart: string;
	periodEnd: string;
	totalMinutes: number;
	totalExpenses: string;
	status: "awaiting_payment" | "paid";
	confirmedAt: Date | null;
	createdAt: Date;
}
