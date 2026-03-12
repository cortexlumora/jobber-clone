export interface ClientContactDTO {
	id: string;
	clientId: string;
	title: "none" | "Mr." | "Ms." | "Mrs." | "Miss." | "Dr.";
	firstName: string;
	lastName: string;
	role: string | null;
	phone: string | null;
	email: string | null;
	notifications: {
		quoteFollowUp: boolean;
		invoiceFollowUp: boolean;
		appointmentReminders: boolean;
		jobFollowUp: boolean;
	};
	createdAt: Date;
	updatedAt: Date;
}
