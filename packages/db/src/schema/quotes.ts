import { boolean, integer, jsonb, numeric, pgEnum, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import usersSchema from "./users";
import clientsSchema from "./clients";
import filesSchema from "./files";

export const quoteStatusEnum = pgEnum("quote_status", ["draft", "sent", "approved", "rejected", "archived"]);
export const depositTypeEnum = pgEnum("deposit_type", ["none", "deposit", "schedule"]);
export const depositModeEnum = pgEnum("deposit_mode", ["%", "$"]);

const quotesSchema = pgTable("quotes", {
	id: uuid("id").primaryKey().defaultRandom(),
	userId: uuid("user_id").notNull().references(() => usersSchema.id, { onDelete: "cascade" }),
	clientId: uuid("client_id").notNull().references(() => clientsSchema.id, { onDelete: "cascade" }),
	title: varchar("title", { length: 255 }).notNull(),
	quoteNumber: varchar("quote_number", { length: 50 }),
	salesperson: varchar("salesperson", { length: 255 }),
	status: quoteStatusEnum("status").notNull().default("draft"),
	// Introduction
	introTitle: varchar("intro_title", { length: 255 }),
	introDescription: text("intro_description"),
	introImageFileId: uuid("intro_image_file_id").references(() => filesSchema.id, { onDelete: "set null" }),
	// Pricing
	discount: varchar("discount", { length: 50 }),
	tax: varchar("tax", { length: 50 }),
	// Deposit / Payment Schedule
	depositType: depositTypeEnum("deposit_type").notNull().default("none"),
	depositMode: depositModeEnum("deposit_mode").notNull().default("%"),
	depositValue: varchar("deposit_value", { length: 50 }),
	scheduleMode: depositModeEnum("schedule_mode").notNull().default("%"),
	payments: jsonb("payments").$type<{ label: string; amount: string; description: string }[]>(),
	// Content
	clientMessage: text("client_message"),
	contract: text("contract"),
	applyContractToAll: boolean("apply_contract_to_all").notNull().default(false),
	// Notes
	notes: text("notes"),
	// Timestamps
	createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
	deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

export const quoteLineItemsSchema = pgTable("quote_line_items", {
	id: uuid("id").primaryKey().defaultRandom(),
	quoteId: uuid("quote_id").notNull().references(() => quotesSchema.id, { onDelete: "cascade" }),
	type: varchar("type", { length: 20 }).notNull().default("line_item"),
	name: varchar("name", { length: 255 }).notNull(),
	description: text("description"),
	qty: integer("qty").notNull().default(0),
	unitPrice: numeric("unit_price", { precision: 10, scale: 2 }).notNull().default("0"),
	imageFileId: uuid("image_file_id").references(() => filesSchema.id, { onDelete: "set null" }),
	sortOrder: integer("sort_order").notNull().default(0),
	createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export default quotesSchema;
