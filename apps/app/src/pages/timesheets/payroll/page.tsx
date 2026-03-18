import { useQuery } from "@tanstack/react-query";
import { getPayrollSummary } from "../api";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertCircle, CheckCircle } from "lucide-react";

const formatMinutes = (mins: number) =>
	`${Math.floor(mins / 60)}:${String(mins % 60).padStart(2, "0")}`;

const ConfirmPayrollPage = () => {
	const { data: members = [] } = useQuery({
		queryKey: ["payroll-summary"],
		queryFn: getPayrollSummary,
	});

	return (
		<div className="max-w-4xl">
			<h1 className="text-3xl font-bold mb-2">Confirm payroll</h1>
			<p className="text-muted-foreground mb-6">
				Keep tabs on your payroll by updating the status of submitted timesheets and reimbursable expenses.
			</p>

			<div className="rounded-lg border">
				<div className="p-4 border-b">
					<h2 className="text-lg font-semibold">Team</h2>
				</div>
				{members.length === 0 ? (
					<div className="px-4 py-8 text-center text-sm text-muted-foreground">
						No approved timesheets awaiting payroll confirmation.
					</div>
				) : (
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Name</TableHead>
								<TableHead>Expenses</TableHead>
								<TableHead>Hours</TableHead>
								<TableHead>Status</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{members.map((member) => (
								<TableRow key={member.userId}>
									<TableCell>
										<div className="flex items-center gap-3">
											<Avatar size="sm">
												<AvatarFallback>{member.userInitials}</AvatarFallback>
											</Avatar>
											<span className="font-medium">{member.userName}</span>
										</div>
									</TableCell>
									<TableCell>${member.expenses}</TableCell>
									<TableCell>{formatMinutes(member.totalMinutes)}</TableCell>
									<TableCell>
										{member.status === "awaiting_payment" ? (
											<div className="flex items-center gap-1.5 text-orange-500">
												<AlertCircle className="h-4 w-4" />
												<span className="text-sm">Awaiting payment</span>
											</div>
										) : (
											<div className="flex items-center gap-1.5 text-green-600">
												<CheckCircle className="h-4 w-4" />
												<span className="text-sm">Paid</span>
											</div>
										)}
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				)}
			</div>
		</div>
	);
};

export default ConfirmPayrollPage;
