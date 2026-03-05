import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Search } from "lucide-react";
import {
	CommandDialog,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import { navGroups } from "@/config/nav-items";

export function CommandMenu() {
	const [open, setOpen] = useState(false);
	const navigate = useNavigate();

	useEffect(() => {
		const down = (e: KeyboardEvent) => {
			if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
				e.preventDefault();
				setOpen((prev) => !prev);
			}
		};
		document.addEventListener("keydown", down);
		return () => document.removeEventListener("keydown", down);
	}, []);

	const handleSelect = (path: string) => {
		setOpen(false);
		navigate(path);
	};

	return (
		<>
			<button
				onClick={() => setOpen(true)}
				className="flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
			>
				<Search className="h-4 w-4" />
				<span>Search...</span>
				<kbd className="ml-4 pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
					<span className="text-xs">⌘</span>K
				</kbd>
			</button>
			<CommandDialog open={open} onOpenChange={setOpen}>
				<CommandInput placeholder="Search pages..." />
				<CommandList>
					<CommandEmpty>No results found.</CommandEmpty>
					{navGroups.map((group) => (
						<CommandGroup key={group.label} heading={group.label}>
							{group.items.map((item) => (
								<CommandItem
									key={item.path}
									onSelect={() => handleSelect(item.path)}
								>
									<item.icon className="mr-2 h-4 w-4" />
									{item.title}
								</CommandItem>
							))}
						</CommandGroup>
					))}
				</CommandList>
			</CommandDialog>
		</>
	);
}
