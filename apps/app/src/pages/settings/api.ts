import type { APIResponse, CompanySettingsDTO, CustomFieldDefinitionDTO, TeamMemberDTO } from "@repo/dto";
import type { UpdateCompanySettingsForm } from "@repo/zod/company-settings";
import type { CreateCustomFieldForm } from "@repo/zod/custom-field";
import type { InviteTeamMemberForm, AcceptInviteForm } from "@repo/zod/team";
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
