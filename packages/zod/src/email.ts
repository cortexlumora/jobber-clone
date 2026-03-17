import { z } from "zod";

export const sendEmailSchema = z.object({
	to: z.string().email("Valid email is required"),
	subject: z.string().min(1, "Subject is required"),
	message: z.string().min(1, "Message is required"),
	sendCopyToSelf: z.boolean().optional(),
});

export type SendEmailForm = z.infer<typeof sendEmailSchema>;
