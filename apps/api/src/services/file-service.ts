import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import db, { filesSchema } from "@repo/db";
import { randomUUID } from "crypto";
import { s3, S3_BUCKET } from "../lib/s3";

export async function presignUpload(fileName: string, contentType: string) {
	const ext = fileName.split(".").pop();
	const key = `uploads/${randomUUID()}${ext ? `.${ext}` : ""}`;

	const command = new PutObjectCommand({
		Bucket: S3_BUCKET,
		Key: key,
		ContentType: contentType,
	});

	const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 });

	const [file] = await db
		.insert(filesSchema)
		.values({
			name: fileName,
			contentLength: 0,
			contentType,
			key,
		})
		.returning();

	return { fileId: file.id, key, uploadUrl };
}
