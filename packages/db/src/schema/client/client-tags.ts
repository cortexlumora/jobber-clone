import { pgTable, primaryKey, timestamp, uuid } from "drizzle-orm/pg-core";
import clientsSchema from "./clients";
import tagsSchema from "./tags";

const clientTagsSchema = pgTable("client_tags", {
	clientId: uuid("client_id").notNull().references(() => clientsSchema.id, { onDelete: "cascade" }),
	tagId: uuid("tag_id").notNull().references(() => tagsSchema.id, { onDelete: "cascade" }),
	createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
	primaryKey({ columns: [t.clientId, t.tagId] }),
]);

export default clientTagsSchema;
