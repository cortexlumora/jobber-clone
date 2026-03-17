import type { APIResponse, PresignUploadDTO, EmailLogDTO } from "@repo/dto";
import type { SendEmailForm } from "@repo/zod/email";
import axios from "axios";
import { http } from "./http";

export async function presignUpload(fileName: string, contentType: string) {
	const res = await http.post<APIResponse<PresignUploadDTO>>("/api/v1/files/presign", { fileName, contentType });
	return res.data.data;
}

export async function uploadFileToS3(uploadUrl: string, file: File) {
	await axios.put(uploadUrl, file, {
		headers: { "Content-Type": file.type },
	});
}

export async function sendEmail(data: SendEmailForm) {
	const res = await http.post<APIResponse<EmailLogDTO>>("/api/v1/emails/send", data);
	return res.data.data;
}
