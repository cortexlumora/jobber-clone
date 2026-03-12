import type {
	APIResponse,
	CompanySettingsDTO,
	CustomFieldDefinitionDTO,
	TeamMemberDTO,
	RequestFormDTO,
	BookableServiceDTO,
	RequestsBookingsSettingsDTO,
} from "@repo/dto";
import type { UpdateCompanySettingsForm } from "@repo/zod/company-settings";
import type { CreateCustomFieldForm } from "@repo/zod/custom-field";
import type { InviteTeamMemberForm, AcceptInviteForm } from "@repo/zod/team";
import type { CreateRequestFormForm } from "@repo/zod/request-form";
import type { CreateBookableServiceForm, UpdateBookableServiceForm } from "@repo/zod/bookable-service";
import type { UpdateRequestsBookingsSettingsForm } from "@repo/zod/requests-bookings-settings";
import { http } from "@/lib/http";

// Company Settings
export async function getCompanySettings() {
	const res = await http.get<APIResponse<CompanySettingsDTO | null>>("/api/v1/company-settings");
	return res.data.data;
}

export async function updateCompanySettings(data: UpdateCompanySettingsForm) {
	const res = await http.put<APIResponse<CompanySettingsDTO>>("/api/v1/company-settings", data);
	return res.data.data;
}

// Custom Fields
export async function getCustomFieldDefinitions(appliesTo?: string) {
	const params = appliesTo ? `?appliesTo=${appliesTo}` : "";
	const res = await http.get<APIResponse<CustomFieldDefinitionDTO[]>>(`/api/v1/custom-fields/definitions${params}`);
	return res.data.data;
}

export async function createCustomFieldDefinition(data: CreateCustomFieldForm) {
	const res = await http.post<APIResponse<CustomFieldDefinitionDTO>>("/api/v1/custom-fields/definitions", data);
	return res.data.data;
}

export async function deleteCustomFieldDefinition(id: string) {
	const res = await http.delete<APIResponse<CustomFieldDefinitionDTO>>(`/api/v1/custom-fields/definitions/${id}`);
	return res.data.data;
}

// Team
export async function getTeamMembers() {
	const res = await http.get<APIResponse<TeamMemberDTO[]>>("/api/v1/team");
	return res.data.data;
}

export async function inviteTeamMember(data: InviteTeamMemberForm) {
	const res = await http.post<APIResponse<{ user: TeamMemberDTO; inviteToken: string }>>("/api/v1/team/invite", data);
	return res.data.data;
}

export async function getInviteByToken(token: string) {
	const res = await http.get<APIResponse<{ id: string; name: string; email: string }>>(`/api/v1/team/invite/${token}`);
	return res.data.data;
}

export async function acceptInvite(data: AcceptInviteForm) {
	const res = await http.post<APIResponse<TeamMemberDTO>>("/api/v1/team/invite/accept", data);
	return res.data.data;
}

// Requests & Bookings Settings
export async function getRequestsBookingsSettings() {
	const res = await http.get<APIResponse<RequestsBookingsSettingsDTO | null>>("/api/v1/requests-bookings/settings");
	return res.data.data;
}

export async function updateRequestsBookingsSettings(data: UpdateRequestsBookingsSettingsForm) {
	const res = await http.put<APIResponse<RequestsBookingsSettingsDTO>>("/api/v1/requests-bookings/settings", data);
	return res.data.data;
}

// Request Forms
export async function getRequestForms() {
	const res = await http.get<APIResponse<RequestFormDTO[]>>("/api/v1/requests-bookings/forms");
	return res.data.data;
}

export async function createRequestForm(data: CreateRequestFormForm) {
	const res = await http.post<APIResponse<RequestFormDTO>>("/api/v1/requests-bookings/forms", data);
	return res.data.data;
}

export async function deleteRequestForm(id: string) {
	const res = await http.delete<APIResponse<RequestFormDTO>>(`/api/v1/requests-bookings/forms/${id}`);
	return res.data.data;
}

// Bookable Services
export async function getBookableServices() {
	const res = await http.get<APIResponse<BookableServiceDTO[]>>("/api/v1/requests-bookings/services");
	return res.data.data;
}

export async function createBookableService(data: CreateBookableServiceForm) {
	const res = await http.post<APIResponse<BookableServiceDTO>>("/api/v1/requests-bookings/services", data);
	return res.data.data;
}

export async function updateBookableServiceApi(id: string, data: UpdateBookableServiceForm) {
	const res = await http.put<APIResponse<BookableServiceDTO>>(`/api/v1/requests-bookings/services/${id}`, data);
	return res.data.data;
}

export async function deleteBookableService(id: string) {
	const res = await http.delete<APIResponse<BookableServiceDTO>>(`/api/v1/requests-bookings/services/${id}`);
	return res.data.data;
}

// Products & Services
export async function getProductsServices(params?: { search?: string; page?: number; limit?: number }) {
	const searchParams = new URLSearchParams();
	if (params?.search) searchParams.set("search", params.search);
	if (params?.page) searchParams.set("page", params.page.toString());
	if (params?.limit) searchParams.set("limit", params.limit.toString());
	const query = searchParams.toString();
	const res = await http.get(`/api/v1/products-services${query ? `?${query}` : ""}`);
	return res.data;
}

export async function createProductService(data: any) {
	const res = await http.post("/api/v1/products-services", data);
	return res.data.data;
}

export async function deleteProductService(id: string) {
	const res = await http.delete(`/api/v1/products-services/${id}`);
	return res.data.data;
}
