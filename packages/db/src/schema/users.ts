import { pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

const usersSchema = pgTable("users", {
	id: uuid("id").primaryKey().defaultRandom(),
	name: varchar("name", { length: 255 }).notNull(),
	email: varchar("email", { length: 255 }).notNull().unique(),
	createdAt: timestamp("created_at", {withTimezone: true}).notNull().defaultNow(),
	updatedAt: timestamp("updated_at", {withTimezone: true}).notNull().defaultNow().$onUpdate(() => new Date()),
})

export default usersSchema;