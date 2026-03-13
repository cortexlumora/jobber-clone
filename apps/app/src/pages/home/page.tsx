import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import type { APIResponse, DashboardDTO } from "@repo/dto";
import { http } from "@/lib/http";
import {
	ClipboardList,
	MessageSquareQuote,
	Wrench,
	Receipt,
} from "lucide-react";

async function getDashboard() {
	const res = await http.get<APIResponse<DashboardDTO>>("/api/v1/dashboard");
	return res.data.data;
}

function getGreeting() {
	const hour = new Date().getHours();
	if (hour < 12) return "Good morning";
	if (hour < 17) return "Good afternoon";
	return "Good evening";
}

const WORKFLOW_CARDS = [
	{
		key: "requests" as const,
		label: "Requests",
		icon: ClipboardList,
		color: "bg-orange-500",
		path: "/requests",
		primary: (d: DashboardDTO) => ({ value: d.requests.new, label: "New" }),
		secondary: (d: DashboardDTO) => [
			{ label: "Assessments complete", value: d.requests.assessmentsComplete },
			{ label: "Overdue", value: d.requests.overdue },
		],
	},
	{
		key: "quotes" as const,
		label: "Quotes",
		icon: MessageSquareQuote,
		color: "bg-pink-500",
		path: "/quotes",
		primary: (d: DashboardDTO) => ({ value: d.quotes.approved, label: "Approved" }),
		secondary: (d: DashboardDTO) => [
			{ label: "Draft", value: d.quotes.draft },
			{ label: "Changes requested", value: d.quotes.changesRequested },
		],
	},
	{
		key: "jobs" as const,
		label: "Jobs",
		icon: Wrench,
		color: "bg-green-500",
		path: "/jobs",
		primary: (d: DashboardDTO) => ({ value: d.jobs.requiresInvoicing, label: "Requires invoicing" }),
		secondary: (d: DashboardDTO) => [
			{ label: "Active", value: d.jobs.active },
			{ label: "Action required", value: d.jobs.actionRequired },
		],
	},
	{
		key: "invoices" as const,
		label: "Invoices",
		icon: Receipt,
		color: "bg-blue-500",
		path: "/invoices",
		primary: (d: DashboardDTO) => ({ value: d.invoices.awaitingPayment, label: "Awaiting payment" }),
		secondary: (d: DashboardDTO) => [
			{ label: "Draft", value: d.invoices.draft },
			{ label: "Past due", value: d.invoices.pastDue },
		],
	},
];

const HomePage = () => {
	const navigate = useNavigate();
	const { data: dashboard } = useQuery({
		queryKey: ["dashboard"],
		queryFn: getDashboard,
	});

	const now = new Date();
	const dateLabel = now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

	return (
		<div>
			{/* Greeting */}
			<div className="mb-8">
				<p className="text-sm text-muted-foreground mb-1">{dateLabel}</p>
				<h1 className="text-3xl font-bold">{getGreeting()}</h1>
			</div>

			{/* Workflow */}
			<div>
				<h2 className="text-lg font-semibold mb-3">Workflow</h2>

				{/* Cards */}
				<div className="grid grid-cols-4 border rounded-lg divide-x">
					{WORKFLOW_CARDS.map((card) => {
						const primary = dashboard ? card.primary(dashboard) : { value: 0, label: "—" };
						const secondary = dashboard ? card.secondary(dashboard) : [];

						return (
							<div
								key={card.key}
								className="p-4 cursor-pointer hover:bg-muted/30 transition-colors"
								onClick={() => navigate(card.path)}
							>
								<div className="flex items-center gap-2 mb-3">
									<card.icon className="h-4 w-4 text-muted-foreground" />
									<span className="text-sm font-medium">{card.label}</span>
								</div>
								<p className="text-3xl font-bold mb-0.5">{primary.value}</p>
								<p className="text-sm font-medium mb-3">{primary.label}</p>
								<div className="space-y-0.5">
									{secondary.map((item) => (
										<p key={item.label} className="text-sm text-muted-foreground">
											{item.label} ({item.value})
										</p>
									))}
								</div>
							</div>
						);
					})}
				</div>
			</div>
		</div>
	);
};

export default HomePage;
