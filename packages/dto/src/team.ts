export interface TeamMemberDTO {
	id: string;
	companyId: string | null;
	name: string;
	email: string;
	role: "admin" | "worker" | "dispatcher" | "manager";
	status: "invited" | "active" | "deactivated";
	phone: string | null;
	street: string | null;
	city: string | null;
	province: string | null;
	postalCode: string | null;
	country: string | null;
	laborCostPerHour: string | null;
	permissions: Record<string, string | boolean> | null;
	createdAt: Date;
}
