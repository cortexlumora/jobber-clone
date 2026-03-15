import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { parseAsBoolean, useQueryState } from "nuqs";
import type { TimeEntryDTO } from "@repo/dto";
import { getTimeEntries, deleteTimeEntry } from "../../time-entries-api";
import { formatCurrency, formatDate } from "@/lib/format";
import Section from "@/components/section";
import TimeEntryDialog from "@/components/time-entry-dialog";
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

interface LaborSectionProps {
	jobId: string;
}

const LaborSection = ({ jobId }: LaborSectionProps) => {
	const queryClient = useQueryClient();
	const [page, setPage] = useState(1);
	const [dialogOpen, setDialogOpen] = useQueryState("new-time-entry", parseAsBoolean.withDefault(false));
	const [editingEntry, setEditingEntry] = useState<TimeEntryDTO | null>(null);

	const { data: result } = useQuery({
		queryKey: ["job-time-entries", jobId, page],
		queryFn: () => getTimeEntries(jobId, page),
		placeholderData: p=>p,
		staleTime: 30_000
	});

	const deleteMutation = useMutation({
		mutationFn: (entryId: string) => deleteTimeEntry(jobId, entryId),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["job", jobId] });
			queryClient.invalidateQueries({ queryKey: ["job-time-entries", jobId] });
		},
	});

	const entries = result?.data ?? [];
	const total = result?.pagination?.total ?? 0;
	const totalPages = Math.ceil(total / PAGE_SIZE);

	const handleOpenChange = (open: boolean) => {
		setDialogOpen(open);
		if (!open) setEditingEntry(null);
	};

	const handleEdit = (entry: TimeEntryDTO) => {
		setEditingEntry(entry);
		setDialogOpen(true);
	};

	return (
		<>
			<Section
				title={`Labor${total > 0 ? ` (${total})` : ""}`}
				action={
					<Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => { setEditingEntry(null); setDialogOpen(true); }}>
						<Plus className="h-3 w-3 mr-1" />
						New Time Entry
					</Button>
				}
			>
				{entries.length > 0 ? (
					<>
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead className="text-muted-foreground">Employee</TableHead>
									<TableHead className="text-muted-foreground">Date</TableHead>
									<TableHead className="text-muted-foreground">Duration</TableHead>
									<TableHead className="text-muted-foreground text-right">Cost</TableHead>
									<TableHead className="w-10" />
								</TableRow>
							</TableHeader>
							<TableBody>
								{entries.map((entry) => {
									const h = Math.floor(entry.durationMinutes / 60);
									const m = entry.durationMinutes % 60;
									return (
										<TableRow key={entry.id} className="cursor-pointer" onClick={() => handleEdit(entry)}>
											<TableCell className="font-medium">{entry.employee}</TableCell>
											<TableCell>{formatDate(new Date(entry.date + "T00:00:00"))}</TableCell>
											<TableCell>{h}h {m > 0 ? `${m}m` : ""}</TableCell>
											<TableCell className="text-right">{formatCurrency(Number(entry.totalCost))}</TableCell>
											<TableCell>
												<Button
													variant="ghost"
													size="sm"
													className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
													onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(entry.id); }}
												>
													<Trash2 className="h-3.5 w-3.5" />
												</Button>
											</TableCell>
										</TableRow>
									);
								})}
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
						Time tracked to this job by you or your team will show here
					</p>
				)}
			</Section>

			<TimeEntryDialog
				open={dialogOpen}
				onOpenChange={handleOpenChange}
				jobId={jobId}
				timeEntry={editingEntry}
			/>
		</>
	);
};

export default LaborSection;
