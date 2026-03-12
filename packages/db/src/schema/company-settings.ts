import { boolean, jsonb, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import usersSchema from "./users";

const companySettingsSchema = pgTable("company_settings", {
	id: uuid("id").primaryKey().defaultRandom(),
	userId: uuid("user_id").notNull().unique().references(() => usersSchema.id, { onDelete: "cascade" }),
	companyName: varchar("company_name", { length: 255 }),
	phone: varchar("phone", { length: 50 }),
	websiteUrl: varchar("website_url", { length: 500 }),
	email: varchar("email", { length: 255 }),
	street1: varchar("street1", { length: 255 }),
	street2: varchar("street2", { length: 255 }),
	city: varchar("city", { length: 255 }),
	state: varchar("state", { length: 255 }),
	zip: varchar("zip", { length: 20 }),
	businessHours: jsonb("business_hours").$type<Record<string, { enabled: boolean; open: string; close: string }>>(),
	showBusinessHours: boolean("show_business_hours").notNull().default(true),
	taxIdName: varchar("tax_id_name", { length: 100 }),
	taxIdNumber: varchar("tax_id_number", { length: 100 }),
	country: varchar("country", { length: 10 }),
	timezone: varchar("timezone", { length: 100 }),
	dateFormat: varchar("date_format", { length: 20 }).notNull().default("MM/DD/YYYY"),
	timeFormat: varchar("time_format", { length: 10 }).notNull().default("12h"),
	firstDayOfWeek: varchar("first_day_of_week", { length: 10 }).notNull().default("sunday"),
	createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export default companySettingsSchema;
