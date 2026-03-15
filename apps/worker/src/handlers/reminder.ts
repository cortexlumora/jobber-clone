import type { Message } from "@aws-sdk/client-sqs";
import db, { requestsSchema } from "@repo/db";
import { eq, and, isNull } from "drizzle-orm";

export interface ReminderPayload {
	type: "assessment_reminder";
	requestId: string;
	reminderType: string;
	scheduledFor: string;
}

export async function handleReminder(message: Message) {
	if (!message.Body) {
		console.warn("Empty message body, skipping");
		return;
	}

	const payload = JSON.parse(message.Body) as ReminderPayload;

	// Validate against DB
	const [request] = await db
		.select({
			id: requestsSchema.id,
			title: requestsSchema.title,
			teamReminder: requestsSchema.teamReminder,
			reminderScheduleName: requestsSchema.reminderScheduleName,
			assessmentStartDate: requestsSchema.assessmentStartDate,
			assessmentStartTime: requestsSchema.assessmentStartTime,
		})
		.from(requestsSchema)
		.where(and(eq(requestsSchema.id, payload.requestId), isNull(requestsSchema.deletedAt)));

	if (!request) {
		console.warn(`[Reminder] Request ${payload.requestId} not found or deleted, skipping`);
		return;
	}

	// Check if reminder is still active
	if (!request.reminderScheduleName) {
		console.warn(`[Reminder] Request ${payload.requestId} has no active reminder, skipping`);
		return;
	}

	// Check if the reminder type still matches (user might have changed it)
	if (request.teamReminder !== payload.reminderType) {
		console.warn(`[Reminder] Request ${payload.requestId} reminder type changed from ${payload.reminderType} to ${request.teamReminder}, skipping`);
		return;
	}

	// Check if the assessment time still matches
	const currentScheduledFor = `${request.assessmentStartDate}T${request.assessmentStartTime}`;
	if (currentScheduledFor !== payload.scheduledFor) {
		console.warn(`[Reminder] Request ${payload.requestId} assessment time changed from ${payload.scheduledFor} to ${currentScheduledFor}, skipping`);
		return;
	}

	console.log(`[Reminder] Processing reminder for request "${request.title}" (${payload.requestId})`);
	console.log(`  Type: ${payload.reminderType}`);
	console.log(`  Assessment at: ${payload.scheduledFor}`);

	// Mark as processed and clear schedule info
	await db
		.update(requestsSchema)
		.set({ reminderScheduleName: null, reminderScheduledAt: null, reminderProcessedAt: new Date() })
		.where(eq(requestsSchema.id, payload.requestId));

	// TODO: Send email/notification to assigned team members
	// TODO: Create in-app notification record
}
