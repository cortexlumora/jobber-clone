import type { LineItemImageDTO } from "./quote";
import type { TimeEntryDTO } from "./time-entry";
import type { ExpenseDTO } from "./expense";
import type { PaginatedResponse } from "./common";
import type { ClientNoteDTO } from "./client-note";
import type { Phone, Email } from "./client";
import type { InvoiceReminderDTO } from "./invoice";

export interface JobStatsDTO {
	endingWithin30: number;
	lateCount: number;
	requiresInvoicing: number;
	actionRequired: number;
	unscheduled: number;
	recentVisitsCount: number;
	recentVisitsRevenue: number;
	scheduledVisitsCount: number;
	scheduledVisitsRevenue: number;
}

export interface JobListItemDTO {
	id: string;
	clientId: string;
	title: string;
	jobNumber: string | null;
	salesperson: string | null;
	status: "draft" | "active" | "action_required" | "complete" | "archived";
	jobType: "one_off" | "recurring";
	startDate: string | null;
	startTime: string | null;
	endTime: string | null;
	repeats: string | null;
	repeatDays: string[] | null;
	endsType: "after" | "on" | null;
	endsOnDate: string | null;
	total: number;
	createdAt: Date;
	client: {
		title: string;
		firstName: string;
		lastName: string;
		companyName: string | null;
		useCompanyAsPrimary: boolean;
	} | null;
	property: {
		street1: string | null;
		street2: string | null;
		city: string | null;
		state: string | null;
		zip: string | null;
	} | null;
}

export interface JobInvoiceDTO {
	id: string;
	invoiceNumber: string | null;
	dueDate: string | null;
	status: "draft" | "sent" | "paid" | "partial" | "overdue" | "void";
	subject: string | null;
	balance: string;
	total: string;
}

export interface JobClientDTO {
	title: string;
	firstName: string;
	lastName: string;
	companyName: string | null;
	useCompanyAsPrimary: boolean;
	phones: Phone[];
	emails: Email[];
}

export interface JobPropertyDTO {
	street1: string | null;
	street2: string | null;
	city: string | null;
	state: string | null;
	zip: string | null;
}

export interface JobLineItemDTO {
	id: string;
	name: string;
	description: string | null;
	qty: number;
	unitCost: string;
	unitPrice: string;
	image: LineItemImageDTO | null;
	sortOrder: number;
	createdAt: Date;
}

export interface JobVisitDTO {
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
}

export interface JobDTO {
	id: string;
	userId: string;
	clientId: string;
	title: string;
	jobNumber: string | null;
	salesperson: string | null;
	status: "draft" | "active" | "action_required" | "complete" | "archived";
	jobType: "one_off" | "recurring";
	// Schedule
	startDate: string | null;
	startTime: string | null;
	endTime: string | null;
	// Recurring
	repeats: string | null;
	repeatDays: string[] | null;
	endsType: "after" | "on" | null;
	endsAfterVisits: number | null;
	endsOnDate: string | null;
	visitInstructions: string | null;
	// Team
	assignedUserIds: string[] | null;
	// Billing
	billingType: "visit_based" | "fixed_price" | null;
	invoiceFrequency: string | null;
	autoPay: boolean;
	// Related
	relatedQuoteId: string | null;
	relatedRequestId: string | null;
	// Nested
	lineItems: JobLineItemDTO[];
	visits: JobVisitDTO[];
	timeEntries: PaginatedResponse<TimeEntryDTO>;
	expenses: PaginatedResponse<ExpenseDTO>;
	clientNotes: PaginatedResponse<ClientNoteDTO>;
	client: JobClientDTO | null;
	property: JobPropertyDTO | null;
	invoices: PaginatedResponse<JobInvoiceDTO>;
	invoiceReminders: PaginatedResponse<InvoiceReminderDTO>;
	// Timestamps
	createdAt: Date;
	updatedAt: Date;
	deletedAt: Date | null;
}
