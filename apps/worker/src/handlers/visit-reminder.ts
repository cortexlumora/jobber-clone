import type { Message } from "@aws-sdk/client-sqs";
import db, { visitsSchema, jobsSchema } from "@repo/db";
import { eq } from "drizzle-orm";

export interface VisitReminderPayload {
	type: "visit_reminder";
	entityId: string;
	reminderType: string;
	scheduledFor: string;
}

export async function handleVisitReminder(message: Message) {
	if (!message.Body) {
		console.warn("Empty message body, skipping");
		return;
	}

	const payload = JSON.parse(message.Body) as VisitReminderPayload;

	// Validate visit exists
	const [visit] = await db
		.select()
		.from(visitsSchema)
		.where(eq(visitsSchema.id, payload.entityId));

	if (!visit) {
		console.warn(`[Visit Reminder] Visit ${payload.entityId} not found, skipping`);
		return;
	}

	if (visit.status === "cancelled") {
		console.warn(`[Visit Reminder] Visit ${payload.entityId} is cancelled, skipping`);
		return;
	}

	if (!visit.reminderScheduleName) {
		console.warn(`[Visit Reminder] Visit ${payload.entityId} has no active reminder, skipping`);
		return;
	}

	if (visit.teamReminder !== payload.reminderType) {
		console.warn(`[Visit Reminder] Visit ${payload.entityId} reminder type changed, skipping`);
		return;
	}

	const currentScheduledFor = `${visit.startDate}T${visit.startTime}`;
	if (currentScheduledFor !== payload.scheduledFor) {
		console.warn(`[Visit Reminder] Visit ${payload.entityId} time changed, skipping`);
		return;
	}

	// Get job title for logging
	const [job] = await db
		.select({ title: jobsSchema.title })
		.from(jobsSchema)
		.where(eq(jobsSchema.id, visit.jobId));

	console.log(`[Visit Reminder] Processing reminder for visit "${visit.title}" on job "${job?.title}"`);
	console.log(`  Type: ${payload.reminderType}`);
	console.log(`  Visit at: ${payload.scheduledFor}`);
	console.log(`  Assigned to: ${visit.assignedTo ?? "unassigned"}`);

	// Mark as processed
	await db
		.update(visitsSchema)
		.set({ reminderScheduleName: null, reminderScheduledAt: null, reminderProcessedAt: new Date() })
		.where(eq(visitsSchema.id, payload.entityId));

	// TODO: Send email/notification to assigned team member
}
