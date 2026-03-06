import { SidebarTrigger } from "@/components/ui/sidebar";
import { CommandMenu } from "@/components/command-menu";

export function AppHeader() {
	return (
		<header className="flex items-center justify-between border-b px-4 h-14">
			<SidebarTrigger />
			<CommandMenu />
		</header>
	);
}
