import { useLocation, useNavigate } from "react-router";
import {
	Home,
	Plus,
	Calendar,
	Users,
	MessageSquare,
	FileText,
	Briefcase,
	Receipt,
	Megaphone,
	BarChart3,
	DollarSign,
	Clock,
	UsersRound,
	AppWindow,
} from "lucide-react";
import {
	Sidebar,
	SidebarContent,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/components/ui/sidebar";

const mainItems = [
	{ title: "Home", path: "/", icon: Home },
	{ title: "Create", path: "/create", icon: Plus },
	{ title: "Schedule", path: "/schedule", icon: Calendar },
	{ title: "Clients", path: "/clients", icon: Users },
];

const workItems = [
	{ title: "Requests", path: "/requests", icon: MessageSquare },
	{ title: "Quotes", path: "/quotes", icon: FileText },
	{ title: "Jobs", path: "/jobs", icon: Briefcase },
	{ title: "Invoices", path: "/invoices", icon: Receipt },
];

const manageItems = [
	{ title: "Marketing", path: "/marketing", icon: Megaphone },
	{ title: "Reports", path: "/reports", icon: BarChart3 },
	{ title: "Expenses", path: "/expenses", icon: DollarSign },
	{ title: "Timesheets", path: "/timesheets", icon: Clock },
	{ title: "Community", path: "/community", icon: UsersRound },
	{ title: "Apps", path: "/apps", icon: AppWindow },
];

function NavGroup({
	label,
	items,
}: {
	label: string;
	items: { title: string; path: string; icon: React.ComponentType<{ className?: string }> }[];
}) {
	const location = useLocation();
	const navigate = useNavigate();

	return (
		<SidebarGroup>
			<SidebarGroupLabel>{label}</SidebarGroupLabel>
			<SidebarGroupContent>
				<SidebarMenu>
					{items.map((item) => (
						<SidebarMenuItem key={item.title}>
							<SidebarMenuButton
								isActive={location.pathname === item.path}
								onClick={() => navigate(item.path)}
							>
								<item.icon />
								<span>{item.title}</span>
							</SidebarMenuButton>
						</SidebarMenuItem>
					))}
				</SidebarMenu>
			</SidebarGroupContent>
		</SidebarGroup>
	);
}

export function AppSidebar() {
	return (
		<Sidebar>
			<SidebarHeader className="border-b">
				<span className="text-lg font-semibold px-2">Jobber</span>
			</SidebarHeader>
			<SidebarContent>
				<NavGroup label="Main" items={mainItems} />
				<NavGroup label="Work" items={workItems} />
				<NavGroup label="Manage" items={manageItems} />
			</SidebarContent>
		</Sidebar>
	);
}
