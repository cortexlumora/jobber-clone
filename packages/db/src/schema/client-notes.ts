import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import clientsSchema from "./clients";
import usersSchema from "./users";

const clientNotesSchema = pgTable("client_notes", {
	id: uuid("id").primaryKey().defaultRandom(),
	clientId: uuid("client_id").notNull().references(() => clientsSchema.id, { onDelete: "cascade" }),
	createdById: uuid("created_by_id").notNull().references(() => usersSchema.id, { onDelete: "cascade" }),
	content: text("content").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export default clientNotesSchema;
