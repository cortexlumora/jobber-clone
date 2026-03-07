import { pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import customFieldDefinitionsSchema from "./custom-fields";

const customFieldValuesSchema = pgTable("custom_field_values", {
	id: uuid("id").primaryKey().defaultRandom(),
	customFieldId: uuid("custom_field_id").notNull().references(() => customFieldDefinitionsSchema.id, { onDelete: "cascade" }),
	entityType: varchar("entity_type", { length: 50 }).notNull(),
	entityId: uuid("entity_id").notNull(),
	value: text("value"),
	createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export default customFieldValuesSchema;
