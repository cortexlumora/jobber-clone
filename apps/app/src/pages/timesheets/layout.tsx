import { NavLink, Outlet } from "react-router";

const timesheetNav = [
	{ label: "Timesheets", path: "/timesheets" },
	{ label: "Approve Timesheets", path: "/timesheets/approve" },
	{ label: "Confirm Payroll", path: "/timesheets/payroll" },
];

const TimesheetsLayout = () => {
	return (
		<div className="flex">
			<aside className="w-52 shrink-0 border-r min-h-[calc(100vh-3.5rem)] p-4 space-y-1 sticky top-14 overflow-y-auto max-h-[calc(100vh-3.5rem)]">
				<h2 className="text-lg font-semibold mb-3">Timesheets</h2>
				{timesheetNav.map((item) => (
					<NavLink
						key={item.path}
						to={item.path}
						end={item.path === "/timesheets"}
						className={({ isActive }) =>
							`block px-3 py-1.5 text-sm rounded-md transition-colors ${
								isActive
									? "text-primary font-semibold"
									: "text-muted-foreground hover:text-foreground"
							}`
						}
					>
						{item.label}
					</NavLink>
				))}
			</aside>
			<div className="flex-1 p-6">
				<Outlet />
			</div>
		</div>
	);
};

export default TimesheetsLayout;
