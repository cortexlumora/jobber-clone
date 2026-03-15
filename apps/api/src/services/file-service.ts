import { PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import db, { filesSchema } from "@repo/db";
import { eq, inArray } from "drizzle-orm";
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

export async function getSignedFiles(fileIds: string[]) {
	if (fileIds.length === 0) return [];

	const files = await db
		.select()
		.from(filesSchema)
		.where(inArray(filesSchema.id, fileIds));

	return Promise.all(
		files.map(async (file) => {
			const command = new GetObjectCommand({ Bucket: S3_BUCKET, Key: file.key });
			const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
			return {
				id: file.id,
				name: file.name,
				contentType: file.contentType,
				url,
			};
		}),
	);
}
