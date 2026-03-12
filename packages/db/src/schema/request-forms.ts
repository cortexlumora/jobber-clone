import { boolean, jsonb, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import usersSchema from "./users";

export interface FormFieldConfig {
	id: string;
	type: string;
	label: string;
	required?: boolean;
	options?: string[];
	unit?: string;
}

export interface FormSectionConfig {
	id: string;
	title: string;
	fields: FormFieldConfig[];
}

export interface FormConfig {
	sections: FormSectionConfig[];
}

const requestFormsSchema = pgTable("request_forms", {
	id: uuid("id").primaryKey().defaultRandom(),
	userId: uuid("user_id").notNull().references(() => usersSchema.id, { onDelete: "cascade" }),
	name: varchar("name", { length: 255 }).notNull(),
	description: varchar("description", { length: 1000 }),
	config: jsonb("config").$type<FormConfig>(),
	isDefault: boolean("is_default").notNull().default(false),
	createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export default requestFormsSchema;
