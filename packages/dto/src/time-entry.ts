export interface TimeEntryDTO {
	id: string;
	jobId: string;
	startTime: string | null;
	endTime: string | null;
	durationMinutes: number;
	notes: string | null;
	date: string;
	employee: string;
	employeeCostPerHour: string;
	totalCost: string;
	createdAt: Date;
	updatedAt: Date;
}
