import type { Message } from "@aws-sdk/client-sqs";

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

	console.log(`[Reminder] Request ${payload.requestId}`);
	console.log(`  Type: ${payload.reminderType}`);
	console.log(`  Scheduled for: ${payload.scheduledFor}`);

	// TODO: Send email/notification to assigned team members
	// TODO: Create in-app notification record
}
