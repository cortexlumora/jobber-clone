import type { APIResponse, PresignUploadDTO } from "@repo/dto";
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
