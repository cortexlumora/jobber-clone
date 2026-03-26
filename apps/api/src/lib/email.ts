import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

const ses = new SESClient({
	region: process.env.AWS_REGION!,
	credentials: {
		accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
		secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
	},
});

interface SendEmailOptions {
	to: string;
	subject: string;
	body: string;
	from?: string;
	replyTo?: string;
	cc?: string[];
}

export async function sendEmail(options: SendEmailOptions) {
	const { to, subject, body, from = process.env.SES_FROM_EMAIL!, replyTo, cc } = options;

	const command = new SendEmailCommand({
		Source: from,
		Destination: {
			ToAddresses: [to],
			CcAddresses: cc,
		},
		Message: {
			Subject: { Data: subject },
			Body: {
				Text: { Data: body },
			},
		},
		ReplyToAddresses: replyTo ? [replyTo] : undefined,
	});

	return ses.send(command);
}
