import db, { companySettingsSchema } from "@repo/db";
import type { UpdateCompanySettingsForm } from "@repo/zod/company-settings";
import { eq } from "drizzle-orm";

export async function getCompanySettings(userId: string) {
	const [settings] = await db
		.select()
		.from(companySettingsSchema)
		.where(eq(companySettingsSchema.userId, userId));

	return settings ?? null;
}

export async function upsertCompanySettings(userId: string, data: UpdateCompanySettingsForm) {
	const existing = await getCompanySettings(userId);

	if (existing) {
		const [updated] = await db
			.update(companySettingsSchema)
			.set(data)
			.where(eq(companySettingsSchema.userId, userId))
			.returning();
		return updated;
	}

	const [created] = await db
		.insert(companySettingsSchema)
		.values({ userId, ...data })
		.returning();
	return created;
}
