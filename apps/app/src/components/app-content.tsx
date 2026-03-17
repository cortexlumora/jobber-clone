import { useNavigate, useLocation, Link } from "react-router";
import { Settings, ChevronRight } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { CommandMenu } from "@/components/command-menu";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const LABELS: Record<string, string> = {
	clients: "Clients",
	requests: "Requests",
	quotes: "Quotes",
	jobs: "Jobs",
	invoices: "Invoices",
	schedule: "Schedule",
	create: "Create",
	settings: "Settings",
	marketing: "Marketing",
	reports: "Reports",
	expenses: "Expenses",
	timesheets: "Timesheets",
	community: "Community",
	apps: "Apps",
	edit: "Edit",
	detail: "Detail",
	company: "Company",
	team: "Team",
	"products-services": "Products & Services",
	"custom-fields": "Custom Fields",
	"requests-bookings": "Requests & Bookings",
};

function Breadcrumbs() {
	const location = useLocation();
	const segments = location.pathname.split("/").filter(Boolean);

	if (segments.length === 0) return <span className="text-sm font-medium">Home</span>;

	const crumbs = segments.map((segment, i) => {
		const path = "/" + segments.slice(0, i + 1).join("/");
		const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}/.test(segment);
		const label = isUuid ? "#" + segment.slice(0, 8) : (LABELS[segment] ?? segment.charAt(0).toUpperCase() + segment.slice(1));
		const isLast = i === segments.length - 1;

		return (
			<span key={path} className="flex items-center gap-1.5">
				{i > 0 && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
				{isLast ? (
					<span className="text-sm font-medium">{label}</span>
				) : (
					<Link to={path} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
						{label}
					</Link>
				)}
			</span>
		);
	});

	return <nav className="flex items-center gap-1.5">{crumbs}</nav>;
}

export function AppHeader() {
	const navigate = useNavigate();
	return (
		<header className="sticky top-0 z-10 flex items-center justify-between border-b px-4 h-14 bg-background">
			<div className="flex items-center gap-2">
				<SidebarTrigger />
				<Separator orientation="vertical" className="h-4" />
				<Breadcrumbs />
			</div>
			<div className="flex items-center gap-2">
				<CommandMenu />
				<Button variant="ghost" size="icon" onClick={() => navigate("/settings")}>
					<Settings className="h-4 w-4" />
				</Button>
			</div>
		</header>
	);
}
