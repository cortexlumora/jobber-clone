import { integer, numeric, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import usersSchema from "./users";

const bookableServicesSchema = pgTable("bookable_services", {
	id: uuid("id").primaryKey().defaultRandom(),
	userId: uuid("user_id").notNull().references(() => usersSchema.id, { onDelete: "cascade" }),
	name: varchar("name", { length: 255 }).notNull(),
	description: varchar("description", { length: 1000 }),
	durationMinutes: integer("duration_minutes").notNull().default(60),
	price: numeric("price", { precision: 10, scale: 2 }).notNull().default("0"),
	createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export default bookableServicesSchema;
