import { integer, numeric, pgEnum, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import usersSchema from "../users";
import jobsSchema from "../job/jobs";

export const timesheetCategoryEnum = pgEnum("timesheet_category", ["general", "job", "break"]);
export const timesheetStatusEnum = pgEnum("timesheet_status", ["pending", "approved", "rejected"]);
export const payrollStatusEnum = pgEnum("payroll_status", ["awaiting_payment", "paid"]);

export const timesheetEntriesSchema = pgTable("timesheet_entries", {
	id: uuid("id").primaryKey().defaultRandom(),
	userId: uuid("user_id").notNull().references(() => usersSchema.id, { onDelete: "cascade" }),
	jobId: uuid("job_id").references(() => jobsSchema.id, { onDelete: "set null" }),
	category: timesheetCategoryEnum("category").notNull().default("general"),
	date: varchar("date", { length: 10 }).notNull(),
	startTime: varchar("start_time", { length: 5 }),
	endTime: varchar("end_time", { length: 5 }),
	durationMinutes: integer("duration_minutes").notNull().default(0),
	notes: text("notes"),
	gpsStartCoords: varchar("gps_start_coords", { length: 50 }),
	gpsEndCoords: varchar("gps_end_coords", { length: 50 }),
	status: timesheetStatusEnum("status").notNull().default("pending"),
	approvedAt: timestamp("approved_at", { withTimezone: true }),
	approvedById: uuid("approved_by_id").references(() => usersSchema.id, { onDelete: "set null" }),
	createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const payrollPeriodsSchema = pgTable("payroll_periods", {
	id: uuid("id").primaryKey().defaultRandom(),
	userId: uuid("user_id").notNull().references(() => usersSchema.id, { onDelete: "cascade" }),
	periodStart: varchar("period_start", { length: 10 }).notNull(),
	periodEnd: varchar("period_end", { length: 10 }).notNull(),
	totalMinutes: integer("total_minutes").notNull().default(0),
	totalExpenses: numeric("total_expenses", { precision: 10, scale: 2 }).notNull().default("0"),
	status: payrollStatusEnum("status").notNull().default("awaiting_payment"),
	confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
	confirmedById: uuid("confirmed_by_id").references(() => usersSchema.id, { onDelete: "set null" }),
	createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});
