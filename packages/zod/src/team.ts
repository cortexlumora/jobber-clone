import { z } from "zod";

export const inviteTeamMemberSchema = z.object({
	name: z.string().min(1, "Full name is required"),
	email: z.string().email("Valid email is required"),
	phone: z.string().optional(),
	street: z.string().optional(),
	city: z.string().optional(),
	province: z.string().optional(),
	postalCode: z.string().optional(),
	country: z.string().optional(),
	laborCostPerHour: z.number().min(0).optional(),
	role: z.enum(["worker", "dispatcher", "manager"]),
	permissions: z.record(z.string(), z.union([z.string(), z.boolean()])).optional(),
	inviteLanguage: z.enum(["english", "spanish"]).optional(),
});

export type InviteTeamMemberForm = z.infer<typeof inviteTeamMemberSchema>;

export const acceptInviteSchema = z.object({
	token: z.string().min(1),
	password: z.string().min(8, "Password must be at least 8 characters"),
});

export type AcceptInviteForm = z.infer<typeof acceptInviteSchema>;
