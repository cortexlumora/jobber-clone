import { boolean, jsonb, pgEnum, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import usersSchema from "./users";

export const clientTitleEnum = pgEnum("client_title", ["none", "Mr.", "Ms.", "Mrs.", "Miss.", "Dr."]);
export const clientStatusEnum = pgEnum("client_status", ["lead", "active", "inactive"]);
export const leadSourceEnum = pgEnum("lead_source", ["facebook", "existing_client", "flyer", "google", "instagram", "referral", "other"]);
export const phoneTypeEnum = pgEnum("phone_type", ["mobile", "landline"]);
export const emailTypeEnum = pgEnum("email_type", ["primary", "secondary", "work", "other"]);

const clientsSchema = pgTable("clients", {
	id: uuid("id").primaryKey().defaultRandom(),
	userId: uuid("user_id").notNull().references(() => usersSchema.id, { onDelete: "cascade" }),
	title: clientTitleEnum("title").notNull().default("none"),
	firstName: varchar("first_name", { length: 255 }).notNull(),
	lastName: varchar("last_name", { length: 255 }).notNull(),
	companyName: varchar("company_name", { length: 255 }),
	status: clientStatusEnum("status").notNull().default("lead"),
	leadSource: leadSourceEnum("lead_source"),
	useCompanyAsPrimary: boolean("use_company_as_primary").notNull().default(false),
	phones: jsonb("phones").$type<{ type: "mobile" | "landline"; number: string }[]>().notNull().default([]),
	emails: jsonb("emails").$type<{ type: "primary" | "secondary" | "work" | "other"; value: string }[]>().notNull().default([]),
	propertyAddress: jsonb("property_address").$type<{
		street1?: string;
		street2?: string;
		city?: string;
		state?: string;
		zip?: string;
		country?: string;
	}>(),
	notifications: jsonb("notifications").$type<{
		quoteFollowUp: boolean;
		appointmentReminders: boolean;
		jobFollowUp: boolean;
		invoiceFollowUp: boolean;
	}>().notNull().default({ quoteFollowUp: true, appointmentReminders: true, jobFollowUp: true, invoiceFollowUp: true }),
	billingSameAsProperty: boolean("billing_same_as_property").notNull().default(true),
	billingAddress: jsonb("billing_address").$type<{
		street1?: string;
		street2?: string;
		city?: string;
		state?: string;
		zip?: string;
		country?: string;
	}>(),
	createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
	deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

export default clientsSchema;
