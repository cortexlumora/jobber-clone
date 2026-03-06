import { SidebarTrigger } from "@/components/ui/sidebar";
import { CommandMenu } from "@/components/command-menu";

export function AppHeader() {
	return (
		<header className="sticky top-0 z-10 flex items-center justify-between border-b px-4 h-14 bg-background">
			<SidebarTrigger />
			<CommandMenu />
		</header>
	);
}
