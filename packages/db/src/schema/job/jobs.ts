import { boolean, integer, jsonb, numeric, pgEnum, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import usersSchema from "../users";
import clientsSchema from "../client/clients";
import filesSchema from "../files";

export const jobTypeEnum = pgEnum("job_type", ["one_off", "recurring"]);
export const jobStatusEnum = pgEnum("job_status", ["draft", "active", "action_required", "complete", "archived"]);
export const billingTypeEnum = pgEnum("billing_type", ["visit_based", "fixed_price"]);
export const endsTypeEnum = pgEnum("ends_type", ["after", "on"]);

const jobsSchema = pgTable("jobs", {
	id: uuid("id").primaryKey().defaultRandom(),
	userId: uuid("user_id").notNull().references(() => usersSchema.id, { onDelete: "cascade" }),
	clientId: uuid("client_id").notNull().references(() => clientsSchema.id, { onDelete: "cascade" }),
	title: varchar("title", { length: 255 }).notNull(),
	jobNumber: varchar("job_number", { length: 50 }),
	salesperson: varchar("salesperson", { length: 255 }),
	status: jobStatusEnum("status").notNull().default("draft"),
	jobType: jobTypeEnum("job_type").notNull().default("one_off"),
	// Schedule
	startDate: varchar("start_date", { length: 10 }),
	startTime: varchar("start_time", { length: 5 }),
	endTime: varchar("end_time", { length: 5 }),
	// Recurring schedule
	repeats: varchar("repeats", { length: 50 }),
	repeatDays: jsonb("repeat_days").$type<string[]>(),
	endsType: endsTypeEnum("ends_type"),
	endsAfterVisits: integer("ends_after_visits"),
	endsOnDate: varchar("ends_on_date", { length: 10 }),
	visitInstructions: text("visit_instructions"),
	// Team assignment
	assignedUserIds: jsonb("assigned_user_ids").$type<string[]>(),
	// Billing (recurring)
	billingType: billingTypeEnum("billing_type"),
	invoiceFrequency: varchar("invoice_frequency", { length: 50 }),
	autoPay: boolean("auto_pay").notNull().default(false),
	// Notes
	notes: text("notes"),
	// Link to related
	relatedQuoteId: uuid("related_quote_id"),
	relatedRequestId: uuid("related_request_id"),
	// Timestamps
	createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
	deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

export const jobLineItemsSchema = pgTable("job_line_items", {
	id: uuid("id").primaryKey().defaultRandom(),
	jobId: uuid("job_id").notNull().references(() => jobsSchema.id, { onDelete: "cascade" }),
	name: varchar("name", { length: 255 }).notNull(),
	description: text("description"),
	qty: integer("qty").notNull().default(1),
	unitCost: numeric("unit_cost", { precision: 10, scale: 2 }).notNull().default("0"),
	unitPrice: numeric("unit_price", { precision: 10, scale: 2 }).notNull().default("0"),
	imageFileId: uuid("image_file_id").references(() => filesSchema.id, { onDelete: "set null" }),
	sortOrder: integer("sort_order").notNull().default(0),
	createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export default jobsSchema;
