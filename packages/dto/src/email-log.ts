export interface EmailLogDTO {
	id: string;
	resourceType: "quote" | "invoice" | "job";
	resourceId: string;
	sentTo: string;
	subject: string;
	message: string;
	sentAt: Date;
}
