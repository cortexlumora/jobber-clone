import { z } from "zod";

export const sendEmailSchema = z.object({
	resourceType: z.enum(["quote", "invoice", "job"]),
	resourceId: z.string().uuid("Valid resource ID is required"),
	to: z.string().email("Valid email is required"),
	subject: z.string().min(1, "Subject is required"),
	message: z.string().min(1, "Message is required"),
	sendCopyToSelf: z.boolean().optional(),
});

export type SendEmailForm = z.infer<typeof sendEmailSchema>;
