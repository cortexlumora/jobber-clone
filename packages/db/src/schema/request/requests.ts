import { boolean, integer, numeric, pgEnum, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import usersSchema from "../users";
import clientsSchema from "../client/clients";
import filesSchema from "../files";

export const requestStatusEnum = pgEnum("request_status", ["new", "assessed", "converted", "archived"]);
export const reminderEnum = pgEnum("team_reminder", ["none", "at_start", "30min", "1hour", "2hour", "5hour", "24hour"]);

const requestsSchema = pgTable("requests", {
	id: uuid("id").primaryKey().defaultRandom(),
	userId: uuid("user_id").notNull().references(() => usersSchema.id, { onDelete: "cascade" }),
	clientId: uuid("client_id").notNull().references(() => clientsSchema.id, { onDelete: "cascade" }),
	title: varchar("title", { length: 255 }).notNull(),
	serviceDescription: text("service_description").notNull(),
	status: requestStatusEnum("status").notNull().default("new"),
	createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
	deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

export const requestAssessmentsSchema = pgTable("request_assessments", {
	id: uuid("id").primaryKey().defaultRandom(),
	requestId: uuid("request_id").notNull().unique().references(() => requestsSchema.id, { onDelete: "cascade" }),
	instructions: text("instructions"),
	startDate: varchar("start_date", { length: 10 }),
	endDate: varchar("end_date", { length: 10 }),
	startTime: varchar("start_time", { length: 5 }),
	endTime: varchar("end_time", { length: 5 }),
	scheduleLater: boolean("schedule_later").notNull().default(false),
	anytime: boolean("anytime").notNull().default(false),
	teamReminder: reminderEnum("team_reminder").notNull().default("none"),
	// Reminder scheduling
	reminderScheduleName: varchar("reminder_schedule_name", { length: 255 }),
	reminderScheduledAt: timestamp("reminder_scheduled_at", { withTimezone: true }),
	reminderProcessedAt: timestamp("reminder_processed_at", { withTimezone: true }),
	createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const requestLineItemsSchema = pgTable("request_line_items", {
	id: uuid("id").primaryKey().defaultRandom(),
	requestId: uuid("request_id").notNull().references(() => requestsSchema.id, { onDelete: "cascade" }),
	name: varchar("name", { length: 255 }).notNull(),
	description: text("description"),
	qty: integer("qty").notNull().default(1),
	unitPrice: numeric("unit_price", { precision: 10, scale: 2 }).notNull().default("0"),
	imageFileId: uuid("image_file_id").references(() => filesSchema.id, { onDelete: "set null" }),
	createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export default requestsSchema;
