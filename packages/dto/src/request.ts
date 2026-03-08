export interface RequestDTO {
	id: string;
	userId: string;
	clientId: string;
	title: string;
	serviceDescription: string;
	status: "new" | "assessed" | "converted" | "archived";
	internalNotes: string | null;
	fileIds: string[];
	createdAt: Date;
	updatedAt: Date;
	deletedAt: Date | null;
}
