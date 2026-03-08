import db, { usersSchema } from "@repo/db";
import type { InviteTeamMemberForm, AcceptInviteForm } from "@repo/zod/team";
import { and, eq, ne } from "drizzle-orm";
import { randomBytes, scrypt, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string): Promise<string> {
	const salt = randomBytes(16).toString("hex");
	const buf = (await scryptAsync(password, salt, 64)) as Buffer;
	return `${salt}:${buf.toString("hex")}`;
}

export async function getTeamMembers(companyId: string) {
	return db
		.select({
			id: usersSchema.id,
			companyId: usersSchema.companyId,
			name: usersSchema.name,
			email: usersSchema.email,
			role: usersSchema.role,
			status: usersSchema.status,
			phone: usersSchema.phone,
			street: usersSchema.street,
			city: usersSchema.city,
			province: usersSchema.province,
			postalCode: usersSchema.postalCode,
			country: usersSchema.country,
			laborCostPerHour: usersSchema.laborCostPerHour,
			permissions: usersSchema.permissions,
			createdAt: usersSchema.createdAt,
		})
		.from(usersSchema)
		.where(and(eq(usersSchema.companyId, companyId), ne(usersSchema.status, "deactivated")));
}

export async function inviteTeamMember(companyId: string, data: InviteTeamMemberForm) {
	// Check if email already exists
	const [existing] = await db
		.select({ id: usersSchema.id })
		.from(usersSchema)
		.where(eq(usersSchema.email, data.email));

	if (existing) {
		throw new Error("A user with this email already exists");
	}

	const inviteToken = randomBytes(32).toString("hex");
	const inviteExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

	const [user] = await db
		.insert(usersSchema)
		.values({
			companyId,
			name: data.name,
			email: data.email,
			role: data.role,
			status: "invited",
			inviteToken,
			inviteExpiresAt,
			phone: data.phone || null,
			street: data.street || null,
			city: data.city || null,
			province: data.province || null,
			postalCode: data.postalCode || null,
			country: data.country || null,
			laborCostPerHour: data.laborCostPerHour != null ? String(data.laborCostPerHour) : null,
			permissions: data.permissions || null,
		})
		.returning();

	return { user, inviteToken };
}

export async function getInviteByToken(token: string) {
	const [user] = await db
		.select({
			id: usersSchema.id,
			name: usersSchema.name,
			email: usersSchema.email,
			status: usersSchema.status,
			inviteExpiresAt: usersSchema.inviteExpiresAt,
		})
		.from(usersSchema)
		.where(eq(usersSchema.inviteToken, token));

	if (!user) return null;
	if (user.status !== "invited") return null;
	if (user.inviteExpiresAt && user.inviteExpiresAt < new Date()) return null;

	return user;
}

export async function acceptInvite(data: AcceptInviteForm) {
	const invite = await getInviteByToken(data.token);
	if (!invite) {
		throw new Error("Invalid or expired invite");
	}

	const passwordHash = await hashPassword(data.password);

	const [user] = await db
		.update(usersSchema)
		.set({
			passwordHash,
			status: "active",
			inviteToken: null,
			inviteExpiresAt: null,
		})
		.where(eq(usersSchema.id, invite.id))
		.returning();

	return user;
}
