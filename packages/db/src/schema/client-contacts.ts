import { jsonb, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import clientsSchema from "./clients";
import { clientTitleEnum } from "./clients";

const clientContactsSchema = pgTable("client_contacts", {
	id: uuid("id").primaryKey().defaultRandom(),
	clientId: uuid("client_id").notNull().references(() => clientsSchema.id, { onDelete: "cascade" }),
	title: clientTitleEnum("title").notNull().default("none"),
	firstName: varchar("first_name", { length: 255 }).notNull(),
	lastName: varchar("last_name", { length: 255 }).notNull(),
	role: varchar("role", { length: 255 }),
	phone: varchar("phone", { length: 50 }),
	email: varchar("email", { length: 255 }),
	notifications: jsonb("notifications").$type<{
		quoteFollowUp: boolean;
		invoiceFollowUp: boolean;
		appointmentReminders: boolean;
		jobFollowUp: boolean;
	}>().notNull().default({
		quoteFollowUp: true,
		invoiceFollowUp: true,
		appointmentReminders: true,
		jobFollowUp: true,
	}),
	createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export default clientContactsSchema;
