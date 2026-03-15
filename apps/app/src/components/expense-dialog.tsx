import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { createExpenseSchema, type CreateExpenseForm } from "@repo/zod/expense";
import type { ExpenseDTO } from "@repo/dto";
import { createExpense, updateExpense } from "@/pages/jobs/expenses-api";
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
};

const ExpenseDialog = ({ open, onOpenChange, jobId, expense }: ExpenseDialogProps) => {
	const queryClient = useQueryClient();
	const isEditing = !!expense;

	const mutation = useMutation({
		mutationFn: (data: CreateExpenseForm) =>
			isEditing ? updateExpense(jobId, expense.id, data) : createExpense(jobId, data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["job", jobId] });
			queryClient.invalidateQueries({ queryKey: ["job-expenses", jobId] });
			reset(defaultValues);
			onOpenChange(false);
		},
	});

	const {
		register,
		handleSubmit,
		reset,
		formState: { errors },
	} = useForm<CreateExpenseForm>({
		resolver: zodResolver(createExpenseSchema) as never,
		defaultValues,
	});

	useEffect(() => {
		if (open && expense) {
			reset({
				itemName: expense.itemName,
				accountingCode: expense.accountingCode ?? "",
				description: expense.description ?? "",
				date: expense.date,
				total: Number(expense.total),
				reimburseTo: expense.reimburseTo ?? "",
			});
		} else if (open) {
			reset(defaultValues);
		}
	}, [open, expense, reset]);

	const onSubmit = (data: CreateExpenseForm) => {
		mutation.mutate(data);
	};

	return (
		<Dialog open={open} onOpenChange={(v) => { if (!v) reset(defaultValues); onOpenChange(v); }}>
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
					</div>
					<DialogFooter>
						<Button type="button" variant="outline" onClick={() => { reset(defaultValues); onOpenChange(false); }}>
							Cancel
						</Button>
						<Button type="submit" disabled={mutation.isPending}>
							{mutation.isPending ? "Saving..." : isEditing ? "Update Expense" : "Save Expense"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
};

export default ExpenseDialog;
