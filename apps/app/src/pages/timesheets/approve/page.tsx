import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getPendingApprovals, approveTimesheets } from "../api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ChevronDown, ChevronRight } from "lucide-react";

const formatMinutes = (mins: number) =>
	`${Math.floor(mins / 60)}:${String(mins % 60).padStart(2, "0")}`;

const ApproveTimesheetsPage = () => {
	const queryClient = useQueryClient();
	const [approveTo, setApproveTo] = useState(new Date().toISOString().slice(0, 10));
	const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
	const [expandedMembers, setExpandedMembers] = useState<string[]>([]);

	const { data: members = [] } = useQuery({
		queryKey: ["timesheet-approvals"],
		queryFn: getPendingApprovals,
	});

	const approveMutation = useMutation({
		mutationFn: () => approveTimesheets({ userIds: selectedMembers, approveTo }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["timesheet-approvals"] });
			setSelectedMembers([]);
		},
	});

	const toggleSelect = (id: string) => {
		setSelectedMembers((prev) =>
			prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id],
		);
	};

	const toggleExpand = (id: string) => {
		setExpandedMembers((prev) =>
			prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id],
		);
	};

	return (
		<div className="max-w-4xl">
			<h1 className="text-3xl font-bold mb-6">Approve timesheets</h1>

			<div className="rounded-lg border p-6 mb-6 space-y-4">
				<h2 className="text-xl font-semibold">Logged hours awaiting approval</h2>
				<div className="space-y-2 max-w-sm">
					<Label className="text-sm font-semibold">Approve to</Label>
					<Input
						type="date"
						value={approveTo}
						onChange={(e) => setApproveTo(e.target.value)}
					/>
				</div>
				<div className="w-full bg-muted rounded-full h-2">
					<div className="bg-primary h-2 rounded-full" style={{ width: members.length > 0 ? "100%" : "0%" }} />
				</div>
			</div>

			{members.length === 0 && (
				<p className="text-sm text-muted-foreground">No pending timesheets to approve.</p>
			)}

			<div className="space-y-4">
				{members.map((member) => {
					const isExpanded = expandedMembers.includes(member.userId);
					const isSelected = selectedMembers.includes(member.userId);

					return (
						<div key={member.userId} className="rounded-lg border">
							<div
								className="flex items-center gap-3 p-4 cursor-pointer"
								onClick={() => toggleExpand(member.userId)}
							>
								<Checkbox
									checked={isSelected}
									onCheckedChange={() => toggleSelect(member.userId)}
									onClick={(e) => e.stopPropagation()}
								/>
								<Avatar size="sm">
									<AvatarFallback>{member.userInitials}</AvatarFallback>
								</Avatar>
								<span className="font-medium flex-1">{member.userName}</span>
								<span className="text-sm font-semibold text-destructive">{formatMinutes(member.totalMinutes)}</span>
								{isExpanded ? (
									<ChevronDown className="h-4 w-4 text-muted-foreground" />
								) : (
									<ChevronRight className="h-4 w-4 text-muted-foreground" />
								)}
							</div>
							{isExpanded && (
								<div className="border-t">
									{member.entries.map((entry, i) => (
										<div
											key={i}
											className={`grid grid-cols-3 px-4 py-2 text-sm ${i === 0 ? "bg-muted/50" : ""}`}
										>
											<span className="font-medium">{entry.date}</span>
											<span>{entry.dayOfWeek}</span>
											<span className="text-right">{formatMinutes(entry.minutes)}</span>
										</div>
									))}
								</div>
							)}
						</div>
					);
				})}
			</div>

			{members.length > 0 && (
				<div className="flex justify-end mt-6">
					<Button
						size="lg"
						disabled={selectedMembers.length === 0 || approveMutation.isPending}
						onClick={() => approveMutation.mutate()}
					>
						{approveMutation.isPending ? "Approving..." : "Approve"}
					</Button>
				</div>
			)}
		</div>
	);
};

export default ApproveTimesheetsPage;
