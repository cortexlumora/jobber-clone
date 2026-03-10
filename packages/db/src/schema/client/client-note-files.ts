import { pgTable, primaryKey, timestamp, uuid } from "drizzle-orm/pg-core";
import clientNotesSchema from "./client-notes";
import filesSchema from "../files";

const clientNoteFilesSchema = pgTable("client_note_files", {
	noteId: uuid("note_id").notNull().references(() => clientNotesSchema.id, { onDelete: "cascade" }),
	fileId: uuid("file_id").notNull().references(() => filesSchema.id, { onDelete: "cascade" }),
	createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
	primaryKey({ columns: [t.noteId, t.fileId] }),
]);

export default clientNoteFilesSchema;
