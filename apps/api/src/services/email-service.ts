import db, { emailLogsSchema, quotesSchema } from "@repo/db";
import { sendEmail } from "../lib/email";
import { eq, desc, and } from "drizzle-orm";
import { NotFound } from "../lib/api-error";

interface SendQuoteEmailParams {
	quoteId: string;
	to: string;
	subject: string;
	message: string;
	sendCopyToSelf?: boolean;
	senderEmail?: string;
}

export async function sendQuoteEmail(params: SendQuoteEmailParams) {
	const { quoteId, to, subject, message, sendCopyToSelf, senderEmail } = params;

	// Verify quote exists
	const [quote] = await db
		.select({ id: quotesSchema.id, status: quotesSchema.status })
		.from(quotesSchema)
		.where(eq(quotesSchema.id, quoteId));

	if (!quote) throw NotFound("Quote not found");

	// Send email via SES
	const cc = sendCopyToSelf && senderEmail ? [senderEmail] : undefined;
	await sendEmail({ to, subject, body: message, cc });

	// Update quote status to "sent" if it's still a draft
	if (quote.status === "draft") {
		await db.update(quotesSchema).set({ status: "sent" }).where(eq(quotesSchema.id, quoteId));
	}

	// Log the email
	const [log] = await db
		.insert(emailLogsSchema)
		.values({
			resourceType: "quote",
			resourceId: quoteId,
			sentTo: to,
			subject,
			message,
		})
		.returning();

	return log;
}

export async function getEmailLogsByResource(resourceType: "quote" | "invoice" | "job", resourceId: string) {
	return db
		.select()
		.from(emailLogsSchema)
		.where(and(eq(emailLogsSchema.resourceType, resourceType), eq(emailLogsSchema.resourceId, resourceId)))
		.orderBy(desc(emailLogsSchema.sentAt));
}
