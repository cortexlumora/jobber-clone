import { boolean, numeric, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import usersSchema from "./users";

const productsServicesSchema = pgTable("products_services", {
	id: uuid("id").primaryKey().defaultRandom(),
	userId: uuid("user_id").notNull().references(() => usersSchema.id, { onDelete: "cascade" }),
	name: varchar("name", { length: 255 }).notNull(),
	description: varchar("description", { length: 1000 }),
	type: varchar("type", { length: 50 }).notNull().default("service"),
	cost: numeric("cost", { precision: 10, scale: 2 }).notNull().default("0"),
	markup: numeric("markup", { precision: 10, scale: 2 }).notNull().default("0"),
	unitPrice: numeric("unit_price", { precision: 10, scale: 2 }).notNull().default("0"),
	taxExempt: boolean("tax_exempt").notNull().default(false),
	onlineBooking: boolean("online_booking").notNull().default(false),
	createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export default productsServicesSchema;
