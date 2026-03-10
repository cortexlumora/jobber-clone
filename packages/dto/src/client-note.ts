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
	content: string;
	files: ClientNoteFileDTO[];
	createdAt: Date;
	updatedAt: Date;
}
