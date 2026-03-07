import { integer, jsonb, pgEnum, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import usersSchema from "./users";

export const fieldTypeEnum = pgEnum("field_type", ["text", "number", "dropdown", "checkbox", "date"]);
export const appliesToEnum = pgEnum("applies_to", ["client", "property", "request", "job"]);

const customFieldDefinitionsSchema = pgTable("custom_field_definitions", {
	id: uuid("id").primaryKey().defaultRandom(),
	userId: uuid("user_id").notNull().references(() => usersSchema.id, { onDelete: "cascade" }),
	name: varchar("name", { length: 255 }).notNull(),
	fieldType: fieldTypeEnum("field_type").notNull(),
	appliesTo: appliesToEnum("applies_to").notNull(),
	defaultValue: text("default_value"),
	options: jsonb("options").$type<string[]>(),
	sortOrder: integer("sort_order").notNull().default(0),
	createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export default customFieldDefinitionsSchema;
