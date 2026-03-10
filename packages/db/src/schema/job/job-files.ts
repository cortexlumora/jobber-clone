import { pgTable, primaryKey, timestamp, uuid } from "drizzle-orm/pg-core";
import jobsSchema from "./jobs";
import filesSchema from "../files";

const jobFilesSchema = pgTable("job_files", {
	jobId: uuid("job_id").notNull().references(() => jobsSchema.id, { onDelete: "cascade" }),
	fileId: uuid("file_id").notNull().references(() => filesSchema.id, { onDelete: "cascade" }),
	createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
	primaryKey({ columns: [t.jobId, t.fileId] }),
]);

export default jobFilesSchema;
