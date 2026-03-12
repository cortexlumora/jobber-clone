import { jsonb, numeric, pgEnum, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", ["admin", "worker", "dispatcher", "manager"]);
export const userStatusEnum = pgEnum("user_status", ["invited", "active", "deactivated"]);

const usersSchema = pgTable("users", {
	id: uuid("id").primaryKey().defaultRandom(),
	companyId: uuid("company_id"),
	name: varchar("name", { length: 255 }).notNull(),
	email: varchar("email", { length: 255 }).notNull().unique(),
	passwordHash: varchar("password_hash", { length: 255 }),
	role: userRoleEnum("role").notNull().default("admin"),
	status: userStatusEnum("status").notNull().default("active"),
	inviteToken: varchar("invite_token", { length: 255 }).unique(),
	inviteExpiresAt: timestamp("invite_expires_at", { withTimezone: true }),
	// Personal info
	phone: varchar("phone", { length: 50 }),
	street: varchar("street", { length: 255 }),
	city: varchar("city", { length: 255 }),
	province: varchar("province", { length: 255 }),
	postalCode: varchar("postal_code", { length: 20 }),
	country: varchar("country", { length: 100 }),
	// Labor
	laborCostPerHour: numeric("labor_cost_per_hour", { precision: 10, scale: 2 }),
	// Permissions
	permissions: jsonb("permissions").$type<Record<string, string | boolean>>(),
	createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export default usersSchema;
