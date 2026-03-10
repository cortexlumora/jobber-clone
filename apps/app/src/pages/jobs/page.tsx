import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { getJobs } from "./api";
import { getClients, getClientProperties } from "@/pages/clients/api";
import type { ClientDTO, JobDTO, PropertyDTO } from "@repo/dto";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Plus, Search, MoreHorizontal } from "lucide-react";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";

const statusColors: Record<string, string> = {
	draft: "bg-gray-100 text-gray-700",
	active: "bg-green-100 text-green-700",
	action_required: "bg-amber-100 text-amber-700",
	complete: "bg-blue-100 text-blue-700",
	archived: "bg-muted text-muted-foreground",
};

const statusLabels: Record<string, string> = {
	draft: "Draft",
	active: "Active",
	action_required: "Action Required",
	complete: "Complete",
	archived: "Archived",
};

function computeTotal(job: JobDTO) {
	return job.lineItems.reduce((sum, item) => sum + item.qty * Number(item.unitPrice), 0);
}

function getScheduleLabel(job: JobDTO) {
	if (!job.startDate) return "Unscheduled";
	if (job.jobType === "one_off") {
		const d = new Date(job.startDate + "T00:00:00");
		return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
	}
	// Recurring
	const parts: string[] = [];
	if (job.repeats) parts.push(job.repeats.charAt(0).toUpperCase() + job.repeats.slice(1));
	if (job.repeatDays && job.repeatDays.length > 0) parts.push(job.repeatDays.join(", "));
	return parts.length > 0 ? parts.join(" - ") : "Recurring";
}

const JobsPage = () => {
	const navigate = useNavigate();
	const [statusFilter, setStatusFilter] = useState("all");
	const [jobTypeFilter, setJobTypeFilter] = useState("all");
	const [search, setSearch] = useState("");

	const { data: jobs, isLoading, isError, error } = useQuery({
		queryKey: ["jobs"],
		queryFn: getJobs,
	});
	const { data: clients } = useQuery({
		queryKey: ["clients"],
		queryFn: getClients,
	});

	const clientMap = useMemo(() => {
		if (!clients) return new Map<string, ClientDTO>();
		return new Map(clients.map((c) => [c.id, c]));
	}, [clients]);

	const clientIds = useMemo(() => {
		if (!jobs) return [];
		return [...new Set(jobs.map((j) => j.clientId))];
	}, [jobs]);

	const { data: propertiesMap } = useQuery({
		queryKey: ["job-client-properties", clientIds],
		queryFn: async () => {
			const map = new Map<string, PropertyDTO[]>();
			await Promise.all(
				clientIds.map(async (clientId) => {
					const props = await getClientProperties(clientId);
					map.set(clientId, props);
				}),
			);
			return map;
		},
		enabled: clientIds.length > 0,
	});

	const getClientDisplayName = (clientId: string) => {
		const client = clientMap.get(clientId);
		if (!client) return "";
		const title = client.title !== "none" ? `${client.title} ` : "";
		const name = client.useCompanyAsPrimary && client.companyName
			? client.companyName
			: `${client.firstName} ${client.lastName}`;
		return `${title}${name}`;
	};

	const getPropertyAddress = (clientId: string) => {
		const props = propertiesMap?.get(clientId);
		if (!props || props.length === 0) return null;
		const p = props[0];
		const parts = [p.street1, p.street2, p.city, p.state, p.zip].filter(Boolean);
		return parts.join(", ");
	};

	// Stats
	const now = new Date();
	const in30Days = new Date(now.getTime() + 30 * 86400000);

	const endingWithin30 = useMemo(() => {
		if (!jobs) return 0;
		return jobs.filter((j) => {
			if (j.jobType !== "recurring" || j.status === "complete" || j.status === "archived") return false;
			if (j.endsType === "on" && j.endsOnDate) {
				const end = new Date(j.endsOnDate + "T00:00:00");
				return end >= now && end <= in30Days;
			}
			return false;
		}).length;
	}, [jobs]);

	const lateCount = useMemo(() => {
		if (!jobs) return 0;
		return jobs.filter((j) => {
			if (j.status === "complete" || j.status === "archived") return false;
			if (j.startDate) {
				const start = new Date(j.startDate + "T00:00:00");
				return start < now && j.status !== "active";
			}
			return false;
		}).length;
	}, [jobs]);

	// TODO: requires invoicing needs invoice tracking
	const requiresInvoicing = useMemo(() => {
		if (!jobs) return 0;
		return jobs.filter((j) => j.status === "complete").length;
	}, [jobs]);

	const actionRequired = useMemo(() => {
		if (!jobs) return 0;
		return jobs.filter((j) => j.status === "action_required").length;
	}, [jobs]);

	const unscheduled = useMemo(() => {
		if (!jobs) return 0;
		return jobs.filter((j) => !j.startDate && j.status !== "complete" && j.status !== "archived").length;
	}, [jobs]);

	// TODO: Recent visits and visits scheduled need a visits tracking system
	const recentVisits = { count: 0, revenue: 0 };
	const scheduledVisits = { count: 0, revenue: 0 };

	const filteredJobs = useMemo(() => {
		if (!jobs) return [];
		let filtered = jobs;
		if (statusFilter !== "all") {
			filtered = filtered.filter((j) => j.status === statusFilter);
		}
		if (jobTypeFilter !== "all") {
			filtered = filtered.filter((j) => j.jobType === jobTypeFilter);
		}
		if (search.trim()) {
			const q = search.toLowerCase();
			filtered = filtered.filter((job) => {
				const clientName = getClientDisplayName(job.clientId);
				return (
					job.title.toLowerCase().includes(q) ||
					clientName.toLowerCase().includes(q) ||
					(job.jobNumber && job.jobNumber.toLowerCase().includes(q))
				);
			});
		}
		return filtered;
	}, [jobs, statusFilter, jobTypeFilter, search, clientMap]);

	return (
		<div>
			{/* Header */}
			<div className="flex items-center justify-between mb-6">
				<h2 className="text-2xl font-semibold">Jobs</h2>
				<div className="flex items-center gap-2">
					<Button onClick={() => navigate("/jobs/create")}>
						<Plus className="h-4 w-4 mr-1" />
						New Job
					</Button>
					<Button variant="outline" size="icon">
						<MoreHorizontal className="h-4 w-4" />
					</Button>
				</div>
			</div>

			{/* Stats Cards */}
			<div className="grid grid-cols-3 gap-4 mb-6">
				{/* Overview */}
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium text-muted-foreground">Overview</CardTitle>
					</CardHeader>
					<CardContent className="space-y-2">
						<div className="flex items-center justify-between text-sm">
							<span className="flex items-center gap-2">
								<span className="h-2.5 w-2.5 rounded-full bg-orange-500" />
								Ending within 30 days
							</span>
							<span className="font-medium">{endingWithin30}</span>
						</div>
						<div className="flex items-center justify-between text-sm">
							<span className="flex items-center gap-2">
								<span className="h-2.5 w-2.5 rounded-full bg-red-500" />
								Late
							</span>
							<span className="font-medium">{lateCount}</span>
						</div>
						<div className="flex items-center justify-between text-sm">
							<span className="flex items-center gap-2">
								<span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
								Requires Invoicing
							</span>
							<span className="font-medium">{requiresInvoicing}</span>
						</div>
						<div className="flex items-center justify-between text-sm">
							<span className="flex items-center gap-2">
								<span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
								Action Required
							</span>
							<span className="font-medium">{actionRequired}</span>
						</div>
						<div className="flex items-center justify-between text-sm">
							<span className="flex items-center gap-2">
								<span className="h-2.5 w-2.5 rounded-full bg-gray-400" />
								Unscheduled
							</span>
							<span className="font-medium">{unscheduled}</span>
						</div>
					</CardContent>
				</Card>

				{/* Recent visits */}
				<Card className="flex flex-col">
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium text-muted-foreground">Recent visits</CardTitle>
						<p className="text-xs text-muted-foreground">Number of visits and the revenue of jobs scheduled for the past 30 days.</p>
						<p className="text-xs text-muted-foreground">Past 30 days</p>
					</CardHeader>
					<CardContent className="mt-auto">
						<div className="flex items-baseline gap-3">
							<span className="text-3xl font-semibold">{recentVisits.count}</span>
							<span className="text-sm text-muted-foreground">0%</span>
							<span className="text-sm font-medium">${recentVisits.revenue}</span>
						</div>
					</CardContent>
				</Card>

				{/* Visits scheduled */}
				<Card className="flex flex-col">
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium text-muted-foreground">Visits scheduled</CardTitle>
						<p className="text-xs text-muted-foreground">Next 30 days</p>
					</CardHeader>
					<CardContent className="mt-auto">
						<div className="flex items-baseline gap-3">
							<span className="text-3xl font-semibold">{scheduledVisits.count}</span>
							<span className="text-sm text-muted-foreground">0%</span>
							<span className="text-sm font-medium">${scheduledVisits.revenue}</span>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Filter Bar */}
			<div className="flex items-center justify-between mb-4">
				<div className="flex items-center gap-2">
					<span className="text-sm font-medium">All jobs</span>
					<span className="text-sm text-muted-foreground">
						({filteredJobs.length} result{filteredJobs.length !== 1 ? "s" : ""})
					</span>
				</div>
				<div className="flex items-center gap-2">
					<Select value={statusFilter} onValueChange={setStatusFilter}>
						<SelectTrigger className="w-32 h-9">
							<SelectValue placeholder="Status" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All</SelectItem>
							<SelectItem value="draft">Draft</SelectItem>
							<SelectItem value="active">Active</SelectItem>
							<SelectItem value="action_required">Action Required</SelectItem>
							<SelectItem value="complete">Complete</SelectItem>
							<SelectItem value="archived">Archived</SelectItem>
						</SelectContent>
					</Select>
					<Select value={jobTypeFilter} onValueChange={setJobTypeFilter}>
						<SelectTrigger className="w-32 h-9">
							<SelectValue placeholder="Job Type" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All</SelectItem>
							<SelectItem value="one_off">One-off</SelectItem>
							<SelectItem value="recurring">Recurring</SelectItem>
						</SelectContent>
					</Select>
					<div className="relative">
						<Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
						<Input
							placeholder="Search jobs..."
							className="pl-8 h-9 w-56"
							value={search}
							onChange={(e) => setSearch(e.target.value)}
						/>
					</div>
				</div>
			</div>

			{/* Table */}
			{isLoading && <p className="text-muted-foreground">Loading...</p>}
			{isError && <p className="text-sm text-destructive">{error.message}</p>}
			{jobs && (
				<div className="rounded-lg border">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Client</TableHead>
								<TableHead>Job number</TableHead>
								<TableHead>Property</TableHead>
								<TableHead>Schedule</TableHead>
								<TableHead>Status</TableHead>
								<TableHead className="text-right">Total</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{filteredJobs.length === 0 && (
								<TableRow>
									<TableCell colSpan={6} className="text-center text-muted-foreground">
										No jobs found
									</TableCell>
								</TableRow>
							)}
							{filteredJobs.map((job) => {
								const clientName = getClientDisplayName(job.clientId);
								const property = getPropertyAddress(job.clientId);
								const total = computeTotal(job);
								const schedule = getScheduleLabel(job);

								return (
									<TableRow key={job.id} className="cursor-pointer hover:bg-muted/50">
										<TableCell>
											<div className="font-medium">{clientName}</div>
											<div className="text-sm text-muted-foreground">{job.title}</div>
										</TableCell>
										<TableCell className="text-sm">
											{job.jobNumber ? `#${job.jobNumber}` : "—"}
										</TableCell>
										<TableCell className="text-sm text-muted-foreground max-w-xs truncate">
											{property ?? "—"}
										</TableCell>
										<TableCell className="text-sm">
											{schedule}
										</TableCell>
										<TableCell>
											<Badge variant="secondary" className={statusColors[job.status] ?? ""}>
												{statusLabels[job.status] ?? job.status}
											</Badge>
										</TableCell>
										<TableCell className="text-right font-medium">
											${total.toFixed(2)}
										</TableCell>
									</TableRow>
								);
							})}
						</TableBody>
					</Table>
				</div>
			)}
		</div>
	);
};

export default JobsPage;
