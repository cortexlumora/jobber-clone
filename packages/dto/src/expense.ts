export interface ExpenseDTO {
	id: string;
	jobId: string;
	itemName: string;
	accountingCode: string | null;
	description: string | null;
	date: string;
	total: string;
	reimburseTo: string | null;
	createdAt: Date;
	updatedAt: Date;
}
