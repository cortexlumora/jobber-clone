import { useNavigate } from "react-router";
import { Settings } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { CommandMenu } from "@/components/command-menu";
import { Button } from "@/components/ui/button";

export function AppHeader() {
	const navigate = useNavigate();
	return (
		<header className="sticky top-0 z-10 flex items-center justify-between border-b px-4 h-14 bg-background">
			<SidebarTrigger />
			<div className="flex items-center gap-2">
				<CommandMenu />
				<Button variant="ghost" size="icon" onClick={() => navigate("/settings")}>
					<Settings className="h-4 w-4" />
				</Button>
			</div>
		</header>
	);
}
