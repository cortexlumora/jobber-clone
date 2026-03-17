import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { createExpenseSchema, type CreateExpenseForm } from "@repo/zod/expense";
import type { ExpenseDTO } from "@repo/dto";
import { createExpense, updateExpense } from "@/pages/jobs/expenses-api";
import { presignUpload, uploadFileToS3 } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from "@/components/ui/dialog";
import { Loader2, Paperclip, X } from "lucide-react";

interface ExpenseDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	jobId: string;
	expense?: ExpenseDTO | null;
}

const defaultValues: CreateExpenseForm = {
	itemName: "",
	accountingCode: "",
	description: "",
	date: new Date().toISOString().slice(0, 10),
	total: 0,
	reimburseTo: "",
	receiptFileId: "",
};

const ExpenseDialog = ({ open, onOpenChange, jobId, expense }: ExpenseDialogProps) => {
	const queryClient = useQueryClient();
	const isEditing = !!expense;

	const [receiptFileName, setReceiptFileName] = useState<string | null>(null);
	const [uploading, setUploading] = useState(false);

	const mutation = useMutation({
		mutationFn: (data: CreateExpenseForm) =>
			isEditing ? updateExpense(jobId, expense.id, data) : createExpense(jobId, data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["job", jobId] });
			queryClient.invalidateQueries({ queryKey: ["job-expenses", jobId] });
			reset(defaultValues);
			setReceiptFileName(null);
			onOpenChange(false);
		},
	});

	const {
		register,
		handleSubmit,
		reset,
		setValue,
		watch,
		formState: { errors },
	} = useForm<CreateExpenseForm>({
		resolver: zodResolver(createExpenseSchema) as never,
		defaultValues,
	});

	const receiptFileId = watch("receiptFileId");

	useEffect(() => {
		if (open && expense) {
			reset({
				itemName: expense.itemName,
				accountingCode: expense.accountingCode ?? "",
				description: expense.description ?? "",
				date: expense.date,
				total: Number(expense.total),
				reimburseTo: expense.reimburseTo ?? "",
				receiptFileId: expense.receiptFileId ?? "",
			});
			setReceiptFileName(expense.receipt?.name ?? null);
		} else if (open) {
			reset(defaultValues);
			setReceiptFileName(null);
		}
	}, [open, expense, reset]);

	const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		setUploading(true);
		try {
			const { fileId, uploadUrl } = await presignUpload(file.name, file.type);
			await uploadFileToS3(uploadUrl, file);
			setValue("receiptFileId", fileId);
			setReceiptFileName(file.name);
		} finally {
			setUploading(false);
		}
		e.target.value = "";
	};

	const removeReceipt = () => {
		setValue("receiptFileId", "");
		setReceiptFileName(null);
	};

	const onSubmit = (data: CreateExpenseForm) => {
		mutation.mutate(data);
	};

	return (
		<Dialog open={open} onOpenChange={(v) => { if (!v) { reset(defaultValues); setReceiptFileName(null); } onOpenChange(v); }}>
			<DialogContent className="max-w-lg">
				<DialogHeader>
					<DialogTitle>{isEditing ? "Edit Expense" : "New Expense"}</DialogTitle>
				</DialogHeader>
				<form onSubmit={handleSubmit(onSubmit)}>
					<div className="space-y-5 py-4">
						<div className="space-y-2">
							<Label>Item name</Label>
							<Input placeholder="e.g. Materials, Permits, Equipment rental" {...register("itemName")} />
							{errors.itemName && <p className="text-sm text-destructive">{errors.itemName.message}</p>}
						</div>

						<div className="space-y-2">
							<Label>Accounting code</Label>
							<Input placeholder="Optional" {...register("accountingCode")} />
						</div>

						<div className="space-y-2">
							<Label>Description</Label>
							<Textarea placeholder="Add details..." rows={3} {...register("description")} />
						</div>

						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label>Date</Label>
								<Input type="date" {...register("date")} />
								{errors.date && <p className="text-sm text-destructive">{errors.date.message}</p>}
							</div>
							<div className="space-y-2">
								<Label>Total ($)</Label>
								<Input type="number" min={0} step="0.01" {...register("total")} />
								{errors.total && <p className="text-sm text-destructive">{errors.total.message}</p>}
							</div>
						</div>

						<div className="space-y-2">
							<Label>Reimburse to</Label>
							<Input placeholder="Not reimbursable" {...register("reimburseTo")} />
							<p className="text-xs text-muted-foreground">Leave empty if not reimbursable</p>
						</div>

						<div className="space-y-2">
							<Label>Receipt</Label>
							{receiptFileId ? (
								<div className="flex items-center gap-2 rounded-md border px-3 py-2">
									<Paperclip className="h-4 w-4 text-muted-foreground shrink-0" />
									<span className="text-sm flex-1 truncate">{receiptFileName}</span>
									<Button type="button" variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={removeReceipt}>
										<X className="h-3.5 w-3.5" />
									</Button>
								</div>
							) : (
								<label className="relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed py-6 cursor-pointer hover:border-primary/50 transition-colors">
									<input
										type="file"
										accept="image/*,.pdf"
										onChange={handleFileChange}
										disabled={uploading}
										className="sr-only"
									/>
									{uploading ? (
										<>
											<Loader2 className="h-5 w-5 animate-spin text-muted-foreground mb-2" />
											<span className="text-sm text-muted-foreground">Uploading...</span>
										</>
									) : (
										<>
											<Button type="button" variant="outline" size="sm" className="pointer-events-none mb-2">
												Add receipt
											</Button>
											<span className="text-sm text-muted-foreground">Select or drag a file here to upload</span>
										</>
									)}
								</label>
							)}
						</div>
					</div>
					<DialogFooter>
						<Button type="button" variant="outline" onClick={() => { reset(defaultValues); setReceiptFileName(null); onOpenChange(false); }}>
							Cancel
						</Button>
						<Button type="submit" disabled={mutation.isPending || uploading}>
							{mutation.isPending ? "Saving..." : isEditing ? "Update Expense" : "Save Expense"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
};

export default ExpenseDialog;
