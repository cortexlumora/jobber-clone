import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { parseAsBoolean, useQueryState } from "nuqs";
import { getExpenses, deleteExpense } from "../../expenses-api";
import { formatCurrency, formatDate } from "@/lib/format";
import Section from "@/components/section";
import ExpenseDialog from "@/components/expense-dialog";
import { Button } from "@/components/ui/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Plus, Trash2, ChevronLeft, ChevronRight } from "lucide-react";

const PAGE_SIZE = 10;

interface ExpensesSectionProps {
	jobId: string;
}

const ExpensesSection = ({ jobId }: ExpensesSectionProps) => {
	const queryClient = useQueryClient();
	const [page, setPage] = useState(1);
	const [dialogOpen, setDialogOpen] = useQueryState("new-expense", parseAsBoolean.withDefault(false));

	const { data: result } = useQuery({
		queryKey: ["job-expenses", jobId, page],
		queryFn: () => getExpenses(jobId, page),
		placeholderData: p=>p,
		staleTime: 30_000
	});

	const deleteMutation = useMutation({
		mutationFn: (expenseId: string) => deleteExpense(jobId, expenseId),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["job", jobId] });
			queryClient.invalidateQueries({ queryKey: ["job-expenses", jobId] });
		},
	});

	const expenses = result?.data ?? [];
	const total = result?.pagination?.total ?? 0;
	const totalPages = Math.ceil(total / PAGE_SIZE);

	return (
		<>
			<Section
				title={`Expenses${total > 0 ? ` (${total})` : ""}`}
				action={
					<Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setDialogOpen(true)}>
						<Plus className="h-3 w-3 mr-1" />
						New Expense
					</Button>
				}
			>
				{expenses.length > 0 ? (
					<>
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead className="text-muted-foreground">Item</TableHead>
									<TableHead className="text-muted-foreground">Date</TableHead>
									<TableHead className="text-muted-foreground">Reimburse to</TableHead>
									<TableHead className="text-muted-foreground text-right">Total</TableHead>
									<TableHead className="w-10" />
								</TableRow>
							</TableHeader>
							<TableBody>
								{expenses.map((expense) => (
									<TableRow key={expense.id}>
										<TableCell className="font-medium">{expense.itemName}</TableCell>
										<TableCell>{formatDate(new Date(expense.date + "T00:00:00"))}</TableCell>
										<TableCell>{expense.reimburseTo ?? "Not reimbursable"}</TableCell>
										<TableCell className="text-right">{formatCurrency(Number(expense.total))}</TableCell>
										<TableCell>
											<Button
												variant="ghost"
												size="sm"
												className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
												onClick={() => deleteMutation.mutate(expense.id)}
											>
												<Trash2 className="h-3.5 w-3.5" />
											</Button>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
						{totalPages > 1 && (
							<div className="flex items-center justify-between px-4 py-3 border-t">
								<p className="text-xs text-muted-foreground">
									{(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}
								</p>
								<div className="flex items-center gap-1">
									<Button variant="ghost" size="icon" className="h-7 w-7" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
										<ChevronLeft className="h-4 w-4" />
									</Button>
									<Button variant="ghost" size="icon" className="h-7 w-7" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
										<ChevronRight className="h-4 w-4" />
									</Button>
								</div>
							</div>
						)}
					</>
				) : (
					<p className="text-sm text-muted-foreground">
						Get an accurate picture of various job costs by recording expenses
					</p>
				)}
			</Section>

			<ExpenseDialog
				open={dialogOpen}
				onOpenChange={setDialogOpen}
				jobId={jobId}
			/>
		</>
	);
};

export default ExpensesSection;
