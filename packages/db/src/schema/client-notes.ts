import { boolean, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import clientsSchema from "./clients";
import usersSchema from "./users";

const clientNotesSchema = pgTable("client_notes", {
	id: uuid("id").primaryKey().defaultRandom(),
	clientId: uuid("client_id").notNull().references(() => clientsSchema.id, { onDelete: "cascade" }),
	createdById: uuid("created_by_id").notNull().references(() => usersSchema.id, { onDelete: "cascade" }),
	content: text("content").notNull(),
	relatedToRequests: boolean("related_to_requests").notNull().default(false),
	relatedToQuotes: boolean("related_to_quotes").notNull().default(false),
	relatedToJobs: boolean("related_to_jobs").notNull().default(false),
	relatedToInvoices: boolean("related_to_invoices").notNull().default(false),
	createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export default clientNotesSchema;
