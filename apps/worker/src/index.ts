import "dotenv/config";
import { ReceiveMessageCommand, DeleteMessageCommand } from "@aws-sdk/client-sqs";
import { sqs, SQS_REMINDER_QUEUE_URL } from "./lib/sqs";
import { handleReminder } from "./handlers/reminder";

let running = true;

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
					await handleReminder(message);

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
			// Wait before retrying on connection errors
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
