export interface BusinessDay {
	enabled: boolean;
	open: string;
	close: string;
}

export interface CompanySettingsDTO {
	id: string;
	userId: string;
	companyName: string | null;
	phone: string | null;
	websiteUrl: string | null;
	email: string | null;
	street1: string | null;
	street2: string | null;
	city: string | null;
	state: string | null;
	zip: string | null;
	businessHours: Record<string, BusinessDay> | null;
	showBusinessHours: boolean;
	taxIdName: string | null;
	taxIdNumber: string | null;
	country: string | null;
	timezone: string | null;
	dateFormat: string;
	timeFormat: string;
	firstDayOfWeek: string;
	createdAt: Date;
	updatedAt: Date;
}
