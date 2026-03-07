import { NavLink, Outlet } from "react-router";

const settingsNav = [
	{
		group: "Business Management",
		items: [
			{ label: "Company Settings", path: "/settings/company" },
			{ label: "Business Profile", path: "/settings/business-profile" },
			{ label: "Products & Services", path: "/settings/products-services" },
			{ label: "Custom Fields", path: "/settings/custom-fields" },
			{ label: "Payments", path: "/settings/payments" },
			{ label: "Expense Tracking", path: "/settings/expense-tracking" },
			{ label: "Automations", path: "/settings/automations" },
		],
	},
	{
		group: "Team Organization",
		items: [
			{ label: "Manage Team", path: "/settings/team" },
			{ label: "Work Settings", path: "/settings/work-settings" },
			{ label: "Schedule", path: "/settings/schedule" },
			{ label: "Location Services", path: "/settings/location-services" },
			{ label: "Job Forms", path: "/settings/job-forms" },
		],
	},
	{
		group: "Client Communication",
		items: [
			{ label: "Client Hub", path: "/settings/client-hub" },
			{ label: "Emails & Text Messages", path: "/settings/emails" },
			{ label: "Requests & Bookings", path: "/settings/requests-bookings" },
		],
	},
];

const SettingsLayout = () => {
	return (
		<div className="flex">
			<aside className="w-64 shrink-0 border-r min-h-[calc(100vh-3.5rem)] p-4 space-y-6">
				<h2 className="text-lg font-semibold">Settings</h2>
				{settingsNav.map((section) => (
					<div key={section.group} className="space-y-1">
						<p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2">
							{section.group}
						</p>
						{section.items.map((item) => (
							<NavLink
								key={item.path}
								to={item.path}
								className={({ isActive }) =>
									`block px-3 py-1.5 text-sm rounded-md transition-colors ${
										isActive
											? "bg-accent text-accent-foreground font-medium"
											: "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
									}`
								}
							>
								{item.label}
							</NavLink>
						))}
					</div>
				))}
			</aside>
			<div className="flex-1 p-6">
				<Outlet />
			</div>
		</div>
	);
};

export default SettingsLayout;
