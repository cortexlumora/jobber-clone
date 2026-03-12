export interface RequestFormDTO {
	id: string;
	userId: string;
	name: string;
	description: string | null;
	isDefault: boolean;
	createdAt: Date;
	updatedAt: Date;
}
