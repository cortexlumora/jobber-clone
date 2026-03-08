import { pgEnum, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import usersSchema from "./users";
import clientsSchema from "./clients";

export const requestStatusEnum = pgEnum("request_status", ["new", "assessed", "converted", "archived"]);

const requestsSchema = pgTable("requests", {
	id: uuid("id").primaryKey().defaultRandom(),
	userId: uuid("user_id").notNull().references(() => usersSchema.id, { onDelete: "cascade" }),
	clientId: uuid("client_id").notNull().references(() => clientsSchema.id, { onDelete: "cascade" }),
	title: varchar("title", { length: 255 }).notNull(),
	serviceDescription: text("service_description").notNull(),
	status: requestStatusEnum("status").notNull().default("new"),
	internalNotes: text("internal_notes"),
	createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
	deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

export default requestsSchema;
