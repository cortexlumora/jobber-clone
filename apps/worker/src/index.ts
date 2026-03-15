import "dotenv/config";
import { ReceiveMessageCommand, DeleteMessageCommand } from "@aws-sdk/client-sqs";
import type { Message } from "@aws-sdk/client-sqs";
import { sqs, SQS_REMINDER_QUEUE_URL } from "./lib/sqs";
import { handleReminder } from "./handlers/reminder";
import { handleVisitReminder } from "./handlers/visit-reminder";

let running = true;

async function routeMessage(message: Message) {
	if (!message.Body) {
		console.warn("Empty message body, skipping");
		return;
	}

	const payload = JSON.parse(message.Body);

	switch (payload.type) {
		case "assessment_reminder":
			return handleReminder(message);
		case "visit_reminder":
			return handleVisitReminder(message);
		default:
			console.warn(`Unknown message type: ${payload.type}, skipping`);
	}
}

async function poll() {
	console.log("Worker started, polling SQS...");

	while (running) {
		try {
			const response = await sqs.send(
				new ReceiveMessageCommand({
					QueueUrl: SQS_REMINDER_QUEUE_URL,
					MaxNumberOfMessages: 10,
					WaitTimeSeconds: 20,
				}),
			);

			if (!response.Messages || response.Messages.length === 0) continue;

			for (const message of response.Messages) {
				try {
					await routeMessage(message);

					await sqs.send(
						new DeleteMessageCommand({
							QueueUrl: SQS_REMINDER_QUEUE_URL,
							ReceiptHandle: message.ReceiptHandle!,
						}),
					);
				} catch (err) {
					console.error(`Failed to process message ${message.MessageId}:`, err);
				}
			}
		} catch (err) {
			console.error("SQS poll error:", err);
			await new Promise((r) => setTimeout(r, 5000));
		}
	}

	console.log("Worker stopped.");
}

const shutdown = () => {
	console.log("Shutting down worker...");
	running = false;
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

poll();
