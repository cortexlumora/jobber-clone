import { boolean, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import clientsSchema from "./clients";

const propertiesSchema = pgTable("properties", {
	id: uuid("id").primaryKey().defaultRandom(),
	clientId: uuid("client_id").notNull().references(() => clientsSchema.id, { onDelete: "cascade" }),
	street1: varchar("street1", { length: 255 }),
	street2: varchar("street2", { length: 255 }),
	city: varchar("city", { length: 255 }),
	state: varchar("state", { length: 255 }),
	zip: varchar("zip", { length: 20 }),
	country: varchar("country", { length: 255 }),
	billingSameAsProperty: boolean("billing_same_as_property").notNull().default(true),
	billingStreet1: varchar("billing_street1", { length: 255 }),
	billingStreet2: varchar("billing_street2", { length: 255 }),
	billingCity: varchar("billing_city", { length: 255 }),
	billingState: varchar("billing_state", { length: 255 }),
	billingZip: varchar("billing_zip", { length: 20 }),
	billingCountry: varchar("billing_country", { length: 255 }),
	createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export default propertiesSchema;
