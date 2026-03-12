import { z } from "zod";

export const updateRequestsBookingsSettingsSchema = z.object({
	requestFormVisible: z.boolean().optional(),
	maxDriveTimeMinutes: z.number().int().min(0).optional(),
	serviceAreaEnabled: z.boolean().optional(),
	bookableTeamMemberIds: z.array(z.string().uuid()).optional(),
});

export type UpdateRequestsBookingsSettingsForm = z.infer<typeof updateRequestsBookingsSettingsSchema>;
