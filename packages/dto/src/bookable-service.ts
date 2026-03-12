export interface BookableServiceDTO {
	id: string;
	userId: string;
	name: string;
	description: string | null;
	durationMinutes: number;
	price: string;
	createdAt: Date;
	updatedAt: Date;
}
