import { z } from "zod";

export const createExpenseSchema = z.object({
	itemName: z.string().min(1, "Item name is required"),
	accountingCode: z.string().optional(),
	description: z.string().optional(),
	date: z.string().min(1, "Date is required"),
	total: z.coerce.number().min(0, "Total must be positive"),
	reimburseTo: z.string().optional(),
	receiptFileId: z.string().optional(),
});

export type CreateExpenseForm = z.infer<typeof createExpenseSchema>;
