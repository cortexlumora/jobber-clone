import { boolean, integer, jsonb, pgTable, timestamp, uuid } from "drizzle-orm/pg-core";
import usersSchema from "./users";

const requestsBookingsSettingsSchema = pgTable("requests_bookings_settings", {
	id: uuid("id").primaryKey().defaultRandom(),
	userId: uuid("user_id").notNull().unique().references(() => usersSchema.id, { onDelete: "cascade" }),
	// Requests settings
	requestFormVisible: boolean("request_form_visible").notNull().default(true),
	// Bookings settings
	maxDriveTimeMinutes: integer("max_drive_time_minutes").notNull().default(30),
	serviceAreaEnabled: boolean("service_area_enabled").notNull().default(false),
	bookableTeamMemberIds: jsonb("bookable_team_member_ids").$type<string[]>().notNull().default([]),
	createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export default requestsBookingsSettingsSchema;
