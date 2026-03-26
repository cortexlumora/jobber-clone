import type { Message } from "@aws-sdk/client-sqs";
import db, { jobSchedulesSchema, jobsSchema, visitsSchema } from "@repo/db";
import { eq } from "drizzle-orm";

export interface JobSchedulePayload {
	type: "job_schedule";
	jobScheduleId: string;
	jobId: string;
	jobType: string;
	repeats: string | null;
}

export async function handleJobSchedule(message: Message) {
	if (!message.Body) {
		console.warn("Empty message body, skipping");
		return;
	}

	const payload = JSON.parse(message.Body) as JobSchedulePayload;

	const [schedule] = await db
		.select()
		.from(jobSchedulesSchema)
		.where(eq(jobSchedulesSchema.id, payload.jobScheduleId));

	if (!schedule) {
		console.warn(`[Job Schedule] Schedule ${payload.jobScheduleId} not found, skipping`);
		return;
	}

	if (schedule.scheduleStatus === "paused" || schedule.scheduleStatus === "completed") {
		console.warn(`[Job Schedule] Schedule ${payload.jobScheduleId} is ${schedule.scheduleStatus}, skipping`);
		return;
	}

	const [job] = await db
		.select({ title: jobsSchema.title, status: jobsSchema.status })
		.from(jobsSchema)
		.where(eq(jobsSchema.id, payload.jobId));

	if (!job || job.status === "archived" || job.status === "complete") {
		console.warn(`[Job Schedule] Job ${payload.jobId} is ${job?.status ?? "not found"}, skipping`);
		return;
	}

	// Create a visit for this scheduled occurrence
	const today = new Date().toISOString().slice(0, 10);

	await db.insert(visitsSchema).values({
		jobId: payload.jobId,
		title: job.title,
		instructions: schedule.visitInstructions,
		startDate: today,
		endDate: today,
		startTime: schedule.startTime,
		endTime: schedule.endTime,
		scheduleLater: false,
		anytime: schedule.anytime,
		status: "scheduled",
	});

	console.log(`[Job Schedule] Created visit for job "${job.title}" on ${today}`);

	// For one-off jobs, mark schedule as completed
	if (payload.jobType === "one_off") {
		await db
			.update(jobSchedulesSchema)
			.set({ scheduleStatus: "completed" })
			.where(eq(jobSchedulesSchema.id, payload.jobScheduleId));
	}
}
