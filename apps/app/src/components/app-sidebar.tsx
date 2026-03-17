import { NavLink } from "react-router";
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
	return (
		<SidebarGroup>
			<SidebarGroupLabel>{label}</SidebarGroupLabel>
			<SidebarGroupContent>
				<SidebarMenu>
					{items.map((item) => (
						<SidebarMenuItem key={item.title}>
							<NavLink to={item.path}>
								{({ isActive }) => (
									<SidebarMenuButton isActive={isActive} asChild>
										<span>
											<item.icon />
											<span>{item.title}</span>
										</span>
									</SidebarMenuButton>
								)}
							</NavLink>
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
			<SidebarHeader className="border-b h-14 justify-center">
				<span className="text-lg font-semibold px-2">WorkPulse</span>
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
