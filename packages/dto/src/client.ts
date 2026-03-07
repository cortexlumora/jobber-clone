export interface Address {
	street1?: string;
	street2?: string;
	city?: string;
	state?: string;
	zip?: string;
	country?: string;
}

export interface Phone {
	type: "mobile" | "landline";
	number: string;
}

export interface Email {
	type: "primary" | "secondary" | "work" | "other";
	value: string;
}

export interface ClientStatsDTO {
	newLeads: number;
	newLeadsChange: number;
	newClients: number;
	newClientsChange: number;
	totalNewClients: number;
}

export interface ClientDTO {
	id: string;
	userId: string;
	title: "none" | "Mr." | "Ms." | "Mrs." | "Miss." | "Dr.";
	status: "lead" | "active" | "inactive";
	leadSource: "facebook" | "existing_client" | "flyer" | "google" | "instagram" | "referral" | "other" | null;
	firstName: string;
	lastName: string;
	companyName: string | null;
	useCompanyAsPrimary: boolean;
	phones: Phone[];
	emails: Email[];
	propertyAddress: Address | null;
	notifications: {
		quoteFollowUp: boolean;
		appointmentReminders: boolean;
		jobFollowUp: boolean;
		invoiceFollowUp: boolean;
	};
	billingSameAsProperty: boolean;
	billingAddress: Address | null;
	createdAt: Date;
	updatedAt: Date;
	deletedAt: Date | null;
}
