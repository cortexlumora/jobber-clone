export interface ProductServiceDTO {
	id: string;
	userId: string;
	name: string;
	description: string | null;
	type: string;
	cost: string;
	markup: string;
	unitPrice: string;
	taxExempt: boolean;
	onlineBooking: boolean;
	createdAt: Date;
	updatedAt: Date;
}
