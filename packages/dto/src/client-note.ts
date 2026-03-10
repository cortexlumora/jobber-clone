export interface ClientNoteFileDTO {
	id: string;
	name: string;
	contentType: string;
	url: string;
}

export interface ClientNoteDTO {
	id: string;
	clientId: string;
	createdById: string;
	createdByName: string;
	createdByAvatar: string | null;
	content: string;
	isPinned: boolean;
	relatedToRequests: boolean;
	relatedToQuotes: boolean;
	relatedToJobs: boolean;
	relatedToInvoices: boolean;
	files: ClientNoteFileDTO[];
	createdAt: Date;
	updatedAt: Date;
}
