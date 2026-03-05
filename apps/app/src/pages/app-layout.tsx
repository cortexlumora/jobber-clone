import { Outlet } from "react-router";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CommandMenu } from "@/components/command-menu";

const AppLayout = () => {
	return (
		<TooltipProvider>
			<SidebarProvider>
				<AppSidebar />
				<main className="flex-1">
					<header className="flex items-center justify-between border-b px-4 py-2">
						<SidebarTrigger />
						<CommandMenu />
					</header>
					<div className="p-4">
						<Outlet />
					</div>
				</main>
			</SidebarProvider>
		</TooltipProvider>
	);
};

export default AppLayout;
