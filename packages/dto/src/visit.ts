export interface VisitDTO {
	id: string;
	jobId: string;
	title: string;
	instructions: string | null;
	startDate: string | null;
	endDate: string | null;
	startTime: string | null;
	endTime: string | null;
	scheduleLater: boolean;
	anytime: boolean;
	assignedTo: string | null;
	emailOnAssign: boolean;
	teamReminder: "none" | "at_start" | "30min" | "1hour" | "2hour" | "5hour" | "24hour";
	status: "scheduled" | "completed" | "cancelled";
	createdAt: Date;
	updatedAt: Date;
}
