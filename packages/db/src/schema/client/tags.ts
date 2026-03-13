import { pgTable, timestamp, unique, uuid, varchar } from "drizzle-orm/pg-core";
import usersSchema from "../users";

const tagsSchema = pgTable("tags", {
	id: uuid("id").primaryKey().defaultRandom(),
	userId: uuid("user_id").notNull().references(() => usersSchema.id, { onDelete: "cascade" }),
	name: varchar("name", { length: 100 }).notNull(),
	color: varchar("color", { length: 7 }),
	createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
	unique().on(t.userId, t.name),
]);

export default tagsSchema;
