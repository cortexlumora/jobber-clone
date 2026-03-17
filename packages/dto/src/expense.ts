export interface ExpenseReceiptDTO {
	id: string;
	name: string;
	contentType: string;
	url: string;
}

export interface ExpenseDTO {
	id: string;
	jobId: string;
	itemName: string;
	accountingCode: string | null;
	description: string | null;
	date: string;
	total: string;
	reimburseTo: string | null;
	receiptFileId: string | null;
	receipt: ExpenseReceiptDTO | null;
	createdAt: Date;
	updatedAt: Date;
}
