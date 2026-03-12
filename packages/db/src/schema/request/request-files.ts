import { pgTable, primaryKey, timestamp, uuid } from "drizzle-orm/pg-core";
import requestsSchema from "./requests";
import filesSchema from "../files";

const requestFilesSchema = pgTable("request_files", {
	requestId: uuid("request_id").notNull().references(() => requestsSchema.id, { onDelete: "cascade" }),
	fileId: uuid("file_id").notNull().references(() => filesSchema.id, { onDelete: "cascade" }),
	createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
	primaryKey({ columns: [t.requestId, t.fileId] }),
]);

export default requestFilesSchema;
