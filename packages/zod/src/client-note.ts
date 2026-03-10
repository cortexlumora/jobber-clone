import { z } from "zod";

export const createClientNoteSchema = z.object({
	clientId: z.string().min(1, "Client is required"),
	content: z.string().min(1, "Note content is required"),
	fileIds: z.array(z.string()).default([]),
	relatedToRequests: z.boolean().default(false),
	relatedToQuotes: z.boolean().default(false),
	relatedToJobs: z.boolean().default(false),
	relatedToInvoices: z.boolean().default(false),
});

export type CreateClientNoteForm = z.infer<typeof createClientNoteSchema>;
