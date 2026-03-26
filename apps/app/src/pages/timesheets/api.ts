import type { APIResponse, TimesheetEntryDTO, TimesheetApprovalSummaryDTO, PaginatedResponse } from "@repo/dto";
import type { CreateTimesheetEntryForm, UpdateTimesheetEntryForm, ApproveTimesheetsForm, ConfirmPayrollForm } from "@repo/zod/timesheet";
import { http } from "@/lib/http";

// ── Entries ──────────────────────────────────────────────────────────

export async function createTimesheetEntry(data: CreateTimesheetEntryForm) {
	const res = await http.post<APIResponse<TimesheetEntryDTO>>("/api/v1/timesheets/entries", data);
	return res.data.data;
}

export async function getTimesheetEntries(date: string, page = 1, limit = 50) {
	const res = await http.get<PaginatedResponse<TimesheetEntryDTO>>("/api/v1/timesheets/entries", {
		params: { date, page, limit },
	});
	return res.data;
}

export async function getTimesheetEntriesByWeek(weekStart: string, weekEnd: string) {
	const res = await http.get<{ data: TimesheetEntryDTO[] }>("/api/v1/timesheets/entries", {
		params: { weekStart, weekEnd },
	});
	return res.data.data;
}

export async function updateTimesheetEntry(id: string, data: UpdateTimesheetEntryForm) {
	const res = await http.put<APIResponse<TimesheetEntryDTO>>(`/api/v1/timesheets/entries/${id}`, data);
	return res.data.data;
}

export async function deleteTimesheetEntry(id: string) {
	await http.delete(`/api/v1/timesheets/entries/${id}`);
}

// ── Approvals ────────────────────────────────────────────────────────

export async function getPendingApprovals() {
	const res = await http.get<APIResponse<TimesheetApprovalSummaryDTO[]>>("/api/v1/timesheets/approvals");
	return res.data.data;
}

export async function approveTimesheets(data: ApproveTimesheetsForm) {
	await http.post("/api/v1/timesheets/approvals", data);
}

// ── Payroll ──────────────────────────────────────────────────────────

export async function getPayrollSummary() {
	const res = await http.get<APIResponse<{ userId: string; userName: string; userInitials: string; totalMinutes: number; expenses: string; status: string }[]>>("/api/v1/timesheets/payroll/summary");
	return res.data.data;
}

export async function confirmPayroll(data: ConfirmPayrollForm) {
	const res = await http.post<APIResponse<unknown>>("/api/v1/timesheets/payroll/confirm", data);
	return res.data.data;
}
