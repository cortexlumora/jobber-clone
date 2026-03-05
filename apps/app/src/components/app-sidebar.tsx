import { useLocation, useNavigate } from "react-router";
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
import { navGroups, type NavItem } from "@/config/nav-items";

function NavGroupSection({
	label,
	items,
}: {
	label: string;
	items: NavItem[];
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
				{navGroups.map((group) => (
					<NavGroupSection
						key={group.label}
						label={group.label}
						items={group.items}
					/>
				))}
			</SidebarContent>
		</Sidebar>
	);
}
