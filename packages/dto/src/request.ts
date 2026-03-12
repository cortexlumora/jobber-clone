export interface RequestLineItemDTO {
	id: string;
	requestId: string;
	name: string;
	description: string | null;
	qty: number;
	unitPrice: string;
	imageFileId: string | null;
	createdAt: Date;
}

export interface RequestDTO {
	id: string;
	userId: string;
	clientId: string;
	title: string;
	serviceDescription: string;
	status: "new" | "assessed" | "converted" | "archived";
	assessmentInstructions: string | null;
	assessmentStartDate: string | null;
	assessmentEndDate: string | null;
	assessmentStartTime: string | null;
	assessmentEndTime: string | null;
	scheduleLater: boolean;
	anytime: boolean;
	teamReminder: "none" | "at_start" | "30min" | "1hour" | "2hour" | "5hour" | "24hour";
	lineItems: RequestLineItemDTO[];
	internalNotes: string | null;
	fileIds: string[];
	createdAt: Date;
	updatedAt: Date;
	deletedAt: Date | null;
}
