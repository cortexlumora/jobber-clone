import { zValidator } from "@hono/zod-validator";
import { inviteTeamMemberSchema, acceptInviteSchema } from "@repo/zod/team";
import type { APIResponse, TeamMemberDTO } from "@repo/dto";
import { Hono } from "hono";
import { getUserIdFromCTX } from "../lib/helpers";
import {
	getTeamMembers,
	inviteTeamMember,
	getInviteByToken,
	acceptInvite,
} from "../services/team-service";
import db, { usersSchema } from "@repo/db";
import { eq } from "drizzle-orm";

const teamRoute = new Hono()
	.get("/", async (c) => {
		const userId = getUserIdFromCTX(c);
		const [user] = await db
			.select({ companyId: usersSchema.companyId })
			.from(usersSchema)
			.where(eq(usersSchema.id, userId));

		if (!user?.companyId) {
			return c.json<APIResponse<TeamMemberDTO[]>>({ data: [] });
		}

		const members = await getTeamMembers(user.companyId);
		return c.json<APIResponse<TeamMemberDTO[]>>({ data: members as TeamMemberDTO[] });
	})
	.post("/invite", zValidator("json", inviteTeamMemberSchema), async (c) => {
		const data = c.req.valid("json");
		const userId = getUserIdFromCTX(c);
		const [user] = await db
			.select({ companyId: usersSchema.companyId })
			.from(usersSchema)
			.where(eq(usersSchema.id, userId));

		if (!user?.companyId) {
			return c.json({ error: "No company found" }, 400);
		}

		const result = await inviteTeamMember(user.companyId, data);
		return c.json<APIResponse<{ user: TeamMemberDTO; inviteToken: string }>>({
			data: result as { user: TeamMemberDTO; inviteToken: string },
		});
	})
	.get("/invite/:token", async (c) => {
		const token = c.req.param("token");
		const invite = await getInviteByToken(token);

		if (!invite) {
			return c.json({ error: "Invalid or expired invite" }, 404);
		}

		return c.json<APIResponse<typeof invite>>({ data: invite });
	})
	.post("/invite/accept", zValidator("json", acceptInviteSchema), async (c) => {
		const data = c.req.valid("json");
		const user = await acceptInvite(data);
		return c.json<APIResponse<TeamMemberDTO>>({ data: user as TeamMemberDTO });
	});

export default teamRoute;
