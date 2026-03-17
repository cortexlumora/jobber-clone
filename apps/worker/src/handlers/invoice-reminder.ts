import type { Message } from "@aws-sdk/client-sqs";
import db, { invoiceRemindersSchema, jobsSchema } from "@repo/db";
import { eq } from "drizzle-orm";

export interface InvoiceReminderPayload {
	type: "invoice_reminder";
	entityId: string;
	reminderType: string;
	scheduledFor: string;
}

export async function handleInvoiceReminder(message: Message) {
	if (!message.Body) {
		console.warn("Empty message body, skipping");
		return;
	}

	const payload = JSON.parse(message.Body) as InvoiceReminderPayload;

	// Validate reminder exists
	const [reminder] = await db
		.select()
		.from(invoiceRemindersSchema)
		.where(eq(invoiceRemindersSchema.id, payload.entityId));

	if (!reminder) {
		console.warn(`[Invoice Reminder] Reminder ${payload.entityId} not found, skipping`);
		return;
	}

	if (reminder.status === "cancelled") {
		console.warn(`[Invoice Reminder] Reminder ${payload.entityId} is cancelled, skipping`);
		return;
	}

	// Get job title for logging
	const [job] = await db
		.select({ title: jobsSchema.title })
		.from(jobsSchema)
		.where(eq(jobsSchema.id, reminder.jobId));

	console.log(`[Invoice Reminder] Processing reminder for job "${job?.title}"`);
	console.log(`  Details: ${reminder.details ?? "No details"}`);
	console.log(`  Scheduled for: ${payload.scheduledFor}`);
	console.log(`  Assigned to: ${reminder.assignedUserIds?.join(", ") ?? "unassigned"}`);

	// Mark as completed
	await db
		.update(invoiceRemindersSchema)
		.set({ status: "completed" })
		.where(eq(invoiceRemindersSchema.id, payload.entityId));

	// TODO: Send email/notification to assigned team members
}
