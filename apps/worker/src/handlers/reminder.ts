import type { Message } from "@aws-sdk/client-sqs";
import db, { requestsSchema, requestAssessmentsSchema } from "@repo/db";
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

	// Validate request exists
	const [request] = await db
		.select({ id: requestsSchema.id, title: requestsSchema.title })
		.from(requestsSchema)
		.where(and(eq(requestsSchema.id, payload.requestId), isNull(requestsSchema.deletedAt)));

	if (!request) {
		console.warn(`[Reminder] Request ${payload.requestId} not found or deleted, skipping`);
		return;
	}

	// Validate assessment still matches
	const [assessment] = await db
		.select()
		.from(requestAssessmentsSchema)
		.where(eq(requestAssessmentsSchema.requestId, payload.requestId));

	if (!assessment) {
		console.warn(`[Reminder] Request ${payload.requestId} has no assessment, skipping`);
		return;
	}

	if (!assessment.reminderScheduleName) {
		console.warn(`[Reminder] Request ${payload.requestId} has no active reminder, skipping`);
		return;
	}

	if (assessment.teamReminder !== payload.reminderType) {
		console.warn(`[Reminder] Request ${payload.requestId} reminder type changed from ${payload.reminderType} to ${assessment.teamReminder}, skipping`);
		return;
	}

	const currentScheduledFor = `${assessment.startDate}T${assessment.startTime}`;
	if (currentScheduledFor !== payload.scheduledFor) {
		console.warn(`[Reminder] Request ${payload.requestId} assessment time changed from ${payload.scheduledFor} to ${currentScheduledFor}, skipping`);
		return;
	}

	console.log(`[Reminder] Processing reminder for request "${request.title}" (${payload.requestId})`);
	console.log(`  Type: ${payload.reminderType}`);
	console.log(`  Assessment at: ${payload.scheduledFor}`);

	// Mark as processed and clear schedule info
	await db
		.update(requestAssessmentsSchema)
		.set({ reminderScheduleName: null, reminderScheduledAt: null, reminderProcessedAt: new Date() })
		.where(eq(requestAssessmentsSchema.id, assessment.id));

	// TODO: Send email/notification to assigned team members
	// TODO: Create in-app notification record
}
