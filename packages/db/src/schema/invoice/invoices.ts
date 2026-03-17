import { boolean, integer, jsonb, numeric, pgEnum, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import clientsSchema from "../client/clients";
import jobsSchema from "../job/jobs";
import filesSchema from "../files";

export const invoiceStatusEnum = pgEnum("invoice_status", ["draft", "sent", "paid", "partial", "overdue", "void"]);

const invoicesSchema = pgTable("invoices", {
	id: uuid("id").primaryKey().defaultRandom(),
	clientId: uuid("client_id").notNull().references(() => clientsSchema.id, { onDelete: "cascade" }),
	jobId: uuid("job_id").references(() => jobsSchema.id, { onDelete: "set null" }),
	invoiceNumber: varchar("invoice_number", { length: 50 }),
	status: invoiceStatusEnum("status").notNull().default("draft"),
	subject: varchar("subject", { length: 255 }),
	// Dates
	issuedDate: varchar("issued_date", { length: 10 }),
	dueDate: varchar("due_date", { length: 10 }),
	// Pricing
	discount: numeric("discount", { precision: 10, scale: 2 }),
	tax: numeric("tax", { precision: 10, scale: 2 }),
	// Message
	clientMessage: text("client_message"),
	// Totals
	subtotal: numeric("subtotal", { precision: 10, scale: 2 }).notNull().default("0"),
	total: numeric("total", { precision: 10, scale: 2 }).notNull().default("0"),
	amountPaid: numeric("amount_paid", { precision: 10, scale: 2 }).notNull().default("0"),
	balance: numeric("balance", { precision: 10, scale: 2 }).notNull().default("0"),
	// Timestamps
	createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
	deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

export const invoiceLineItemsSchema = pgTable("invoice_line_items", {
	id: uuid("id").primaryKey().defaultRandom(),
	invoiceId: uuid("invoice_id").notNull().references(() => invoicesSchema.id, { onDelete: "cascade" }),
	name: varchar("name", { length: 255 }).notNull(),
	description: text("description"),
	qty: integer("qty").notNull().default(1),
	unitPrice: numeric("unit_price", { precision: 10, scale: 2 }).notNull().default("0"),
	imageFileId: uuid("image_file_id").references(() => filesSchema.id, { onDelete: "set null" }),
	sortOrder: integer("sort_order").notNull().default(0),
	createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const invoiceReminderStatusEnum = pgEnum("invoice_reminder_status", ["scheduled", "completed", "cancelled"]);

export const invoiceRemindersSchema = pgTable("invoice_reminders", {
	id: uuid("id").primaryKey().defaultRandom(),
	jobId: uuid("job_id").notNull().references(() => jobsSchema.id, { onDelete: "cascade" }),
	details: text("details"),
	startDate: varchar("start_date", { length: 10 }),
	endDate: varchar("end_date", { length: 10 }),
	startTime: varchar("start_time", { length: 5 }),
	endTime: varchar("end_time", { length: 5 }),
	scheduleLater: boolean("schedule_later").notNull().default(false),
	allDay: boolean("all_day").notNull().default(true),
	assignedUserIds: jsonb("assigned_user_ids").$type<string[]>(),
	emailTeam: boolean("email_team").notNull().default(false),
	status: invoiceReminderStatusEnum("status").notNull().default("scheduled"),
	createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export default invoicesSchema;
