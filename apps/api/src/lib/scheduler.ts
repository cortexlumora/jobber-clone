import { SchedulerClient, CreateScheduleCommand, DeleteScheduleCommand } from "@aws-sdk/client-scheduler";

const scheduler = new SchedulerClient({
	region: process.env.AWS_REGION!,
	credentials: {
		accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
		secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
	},
});

const SQS_REMINDER_QUEUE_ARN = process.env.SQS_REMINDER_QUEUE_ARN!;
const SCHEDULER_ROLE_ARN = process.env.SCHEDULER_ROLE_ARN!;

const REMINDER_OFFSETS: Record<string, number> = {
	at_start: 0,
	"30min": 30,
	"1hour": 60,
	"2hour": 120,
	"5hour": 300,
	"24hour": 1440,
};

function computeReminderTime(startDate: string, startTime: string, reminder: string): Date | null {
	const offsetMinutes = REMINDER_OFFSETS[reminder];
	if (offsetMinutes === undefined) return null;

	const dateTime = new Date(`${startDate}T${startTime}:00`);
	if (isNaN(dateTime.getTime())) return null;

	dateTime.setMinutes(dateTime.getMinutes() - offsetMinutes);
	return dateTime;
}

interface ScheduleReminderOptions {
	type: "assessment_reminder" | "visit_reminder";
	entityId: string;
	startDate: string | null;
	startTime: string | null;
	teamReminder: string;
}

export async function createReminderSchedule(
	options: ScheduleReminderOptions,
): Promise<{ scheduleName: string; scheduledAt: Date } | null> {
	const { type, entityId, startDate, startTime, teamReminder } = options;

	if (teamReminder === "none" || !startDate || !startTime) return null;

	const fireAt = computeReminderTime(startDate, startTime, teamReminder);
	if (!fireAt || fireAt <= new Date()) return null;

	const prefix = type === "assessment_reminder" ? "reminder-request" : "reminder-visit";
	const scheduleName = `${prefix}-${entityId}`;
	const utcStr = fireAt.toISOString().replace(/\.\d{3}Z$/, "");

	await scheduler.send(
		new CreateScheduleCommand({
			Name: scheduleName,
			ScheduleExpression: `at(${utcStr})`,
			FlexibleTimeWindow: { Mode: "OFF" },
			ActionAfterCompletion: "DELETE",
			Target: {
				Arn: SQS_REMINDER_QUEUE_ARN,
				RoleArn: SCHEDULER_ROLE_ARN,
				Input: JSON.stringify({
					type,
					entityId,
					reminderType: teamReminder,
					scheduledFor: `${startDate}T${startTime}`,
				}),
			},
		}),
	);

	return { scheduleName, scheduledAt: fireAt };
}

export async function deleteReminderSchedule(scheduleName: string) {
	try {
		await scheduler.send(new DeleteScheduleCommand({ Name: scheduleName }));
	} catch {
		// Schedule may not exist, that's fine
	}
}
