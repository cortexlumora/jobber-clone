import { integer, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

const filesSchema = pgTable("files", {
	id: uuid("id").primaryKey().defaultRandom(),
	name: varchar("name", { length: 255 }).notNull(),
	contentLength: integer("content_length").notNull(),
	contentType: varchar("content_type", { length: 255 }).notNull(),
	key: varchar("key", { length: 512 }).notNull().unique(),
	createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export default filesSchema;
