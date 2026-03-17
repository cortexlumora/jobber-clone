import {
	Home,
	Plus,
	Calendar,
	Users,
	MessageSquare,
	FileText,
	Briefcase,
	Receipt,
	// Megaphone,
	// BarChart3,
	// DollarSign,
	// Clock,
	// UsersRound,
	// AppWindow,
} from "lucide-react";

export type NavItem = {
	title: string;
	path: string;
	icon: React.ComponentType<{ className?: string }>;
};

export type NavGroup = {
	label: string;
	items: NavItem[];
};

export const navGroups: NavGroup[] = [
	{
		label: "Main",
		items: [
			{ title: "Home", path: "/", icon: Home },
			{ title: "Create", path: "/create", icon: Plus },
			{ title: "Schedule", path: "/schedule", icon: Calendar },
			{ title: "Clients", path: "/clients", icon: Users },
		],
	},
	{
		label: "Work",
		items: [
			{ title: "Requests", path: "/requests", icon: MessageSquare },
			{ title: "Quotes", path: "/quotes", icon: FileText },
			{ title: "Jobs", path: "/jobs", icon: Briefcase },
			{ title: "Invoices", path: "/invoices", icon: Receipt },
		],
	},
	// {
	// 	label: "Manage",
	// 	items: [
	// 		{ title: "Marketing", path: "/marketing", icon: Megaphone },
	// 		{ title: "Reports", path: "/reports", icon: BarChart3 },
	// 		{ title: "Expenses", path: "/expenses", icon: DollarSign },
	// 		{ title: "Timesheets", path: "/timesheets", icon: Clock },
	// 		{ title: "Community", path: "/community", icon: UsersRound },
	// 		{ title: "Apps", path: "/apps", icon: AppWindow },
	// 	],
	// },
];
