import { SchedulerClient, CreateScheduleCommand, DeleteScheduleCommand, UpdateScheduleCommand } from "@aws-sdk/client-scheduler";

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
	type: "assessment_reminder" | "visit_reminder" | "invoice_reminder";
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

	const prefix = type === "assessment_reminder" ? "reminder-request" : type === "visit_reminder" ? "reminder-visit" : "reminder-invoice";
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

// ── Job Schedule ─────────────────────────────────────────────────────

const DAY_TO_CRON: Record<string, string> = {
	Sun: "SUN", Mon: "MON", Tue: "TUE", Wed: "WED", Thu: "THU", Fri: "FRI", Sat: "SAT",
};

interface CreateJobScheduleOptions {
	jobScheduleId: string;
	jobId: string;
	jobType: string;
	startDate: string;
	startTime?: string | null;
	repeats?: string | null;
	repeatDay?: string | null;
	endsOnDate?: string | null;
}

function buildScheduleExpression(options: CreateJobScheduleOptions): string {
	const { jobType, startDate, startTime, repeats, repeatDay } = options;
	const time = startTime || "09:00";
	const [hour, minute] = time.split(":").map(Number);

	if (jobType === "one_off") {
		const fireAt = new Date(`${startDate}T${time}:00`);
		const utcStr = fireAt.toISOString().replace(/\.\d{3}Z$/, "");
		return `at(${utcStr})`;
	}

	if (repeats === "daily") {
		return `cron(${minute} ${hour} * * ? *)`;
	}

	if (repeats === "monthly") {
		const dayOfMonth = new Date(`${startDate}T00:00:00`).getDate();
		return `cron(${minute} ${hour} ${dayOfMonth} * ? *)`;
	}

	// weekly / biweekly — EventBridge doesn't support biweekly natively,
	// so we use weekly cron and handle skip logic in the worker
	const cronDay = DAY_TO_CRON[repeatDay ?? "Mon"] ?? "MON";
	return `cron(${minute} ${hour} ? * ${cronDay} *)`;
}

export async function createJobSchedule(options: CreateJobScheduleOptions): Promise<{ scheduleName: string; scheduleArn: string }> {
	const scheduleName = `job-schedule-${options.jobScheduleId}`;
	const expression = buildScheduleExpression(options);
	const isOneOff = options.jobType === "one_off";

	const startDateObj = new Date(`${options.startDate}T00:00:00Z`);
	const fiveMinFromNow = new Date(Date.now() + 5 * 60 * 1000);
	const startInFuture = startDateObj > fiveMinFromNow;

	const result = await scheduler.send(
		new CreateScheduleCommand({
			Name: scheduleName,
			ScheduleExpression: expression,
			ScheduleExpressionTimezone: "UTC",
			FlexibleTimeWindow: { Mode: "OFF" },
			...(isOneOff && { ActionAfterCompletion: "DELETE" }),
			...(options.endsOnDate && {
				EndDate: new Date(`${options.endsOnDate}T23:59:59Z`),
			}),
			...(startInFuture && { StartDate: startDateObj }),
			Target: {
				Arn: SQS_REMINDER_QUEUE_ARN,
				RoleArn: SCHEDULER_ROLE_ARN,
				Input: JSON.stringify({
					type: "job_schedule",
					jobScheduleId: options.jobScheduleId,
					jobId: options.jobId,
					jobType: options.jobType,
					repeats: options.repeats,
				}),
			},
		}),
	);

	return { scheduleName, scheduleArn: result.ScheduleArn ?? "" };
}

export async function deleteJobSchedule(scheduleName: string) {
	try {
		await scheduler.send(new DeleteScheduleCommand({ Name: scheduleName }));
	} catch {
		// Schedule may not exist
	}
}

export async function pauseJobSchedule(scheduleName: string) {
	try {
		await scheduler.send(
			new UpdateScheduleCommand({
				Name: scheduleName,
				State: "DISABLED",
				// UpdateSchedule requires re-specifying these
				ScheduleExpression: "rate(1 day)", // placeholder, won't fire while disabled
				FlexibleTimeWindow: { Mode: "OFF" },
				Target: {
					Arn: SQS_REMINDER_QUEUE_ARN,
					RoleArn: SCHEDULER_ROLE_ARN,
					Input: "{}",
				},
			}),
		);
	} catch {
		// Schedule may not exist
	}
}
