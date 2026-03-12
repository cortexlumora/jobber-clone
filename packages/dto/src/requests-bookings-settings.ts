export interface RequestsBookingsSettingsDTO {
	id: string;
	userId: string;
	requestFormVisible: boolean;
	maxDriveTimeMinutes: number;
	serviceAreaEnabled: boolean;
	bookableTeamMemberIds: string[];
	createdAt: Date;
	updatedAt: Date;
}
