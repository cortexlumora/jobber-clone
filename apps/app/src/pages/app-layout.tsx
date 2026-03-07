import { Outlet } from "react-router";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppHeader } from "@/components/app-content";

const AppLayout = () => {
	return (
		<TooltipProvider>
			<SidebarProvider>
				<AppSidebar />
				<main className="flex-1 flex flex-col">
					<AppHeader />
					<div className="flex-1 p-4">
						<Outlet />
					</div>
				</main>
			</SidebarProvider>
		</TooltipProvider>
	);
};

export default AppLayout;
