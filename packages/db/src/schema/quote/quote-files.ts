import { pgTable, primaryKey, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import quotesSchema from "./quotes";
import filesSchema from "../files";

const quoteFilesSchema = pgTable("quote_files", {
	quoteId: uuid("quote_id").notNull().references(() => quotesSchema.id, { onDelete: "cascade" }),
	fileId: uuid("file_id").notNull().references(() => filesSchema.id, { onDelete: "cascade" }),
	category: varchar("category", { length: 20 }).notNull().default("attachment"),
	createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
	primaryKey({ columns: [t.quoteId, t.fileId] }),
]);

export default quoteFilesSchema;
