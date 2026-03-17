import { pgEnum, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

export const emailResourceTypeEnum = pgEnum("email_resource_type", ["quote", "invoice", "job"]);

const emailLogsSchema = pgTable("email_logs", {
	id: uuid("id").primaryKey().defaultRandom(),
	resourceType: emailResourceTypeEnum("resource_type").notNull(),
	resourceId: uuid("resource_id").notNull(),
	sentTo: varchar("sent_to", { length: 255 }).notNull(),
	subject: varchar("subject", { length: 500 }).notNull(),
	message: text("message").notNull(),
	sentAt: timestamp("sent_at", { withTimezone: true }).notNull().defaultNow(),
});

export default emailLogsSchema;
