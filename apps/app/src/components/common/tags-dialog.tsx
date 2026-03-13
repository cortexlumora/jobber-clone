import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { TagDTO } from "@repo/dto";
import { getTags, createTag, assignTagToClient, removeTagFromClient } from "@/pages/clients/api";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { X, Plus } from "lucide-react";

const TAG_COLORS = [
	"#3b82f6", "#ef4444", "#22c55e", "#f59e0b", "#8b5cf6",
	"#ec4899", "#06b6d4", "#f97316", "#6366f1", "#14b8a6",
];

interface TagsDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	clientId: string;
	clientTags: TagDTO[];
}

export function TagsDialog({ open, onOpenChange, clientId, clientTags }: TagsDialogProps) {
	const queryClient = useQueryClient();
	const [search, setSearch] = useState("");
	const inputRef = useRef<HTMLInputElement>(null);

	const { data: allTags = [] } = useQuery({
		queryKey: ["tags"],
		queryFn: getTags,
		enabled: open,
	});

	const invalidate = () => {
		queryClient.invalidateQueries({ queryKey: ["client", clientId] });
		queryClient.invalidateQueries({ queryKey: ["clients"] });
		queryClient.invalidateQueries({ queryKey: ["tags"] });
	};

	const createAndAssign = useMutation({
		mutationFn: async (name: string) => {
			const color = TAG_COLORS[Math.floor(Math.random() * TAG_COLORS.length)];
			const tag = await createTag({ name, color });
			await assignTagToClient(clientId, tag.id);
		},
		onSuccess: () => {
			invalidate();
			setSearch("");
		},
	});

	const assign = useMutation({
		mutationFn: (tagId: string) => assignTagToClient(clientId, tagId),
		onSuccess: () => {
			invalidate();
			setSearch("");
		},
	});

	const remove = useMutation({
		mutationFn: (tagId: string) => removeTagFromClient(clientId, tagId),
		onSuccess: invalidate,
	});

	useEffect(() => {
		if (open) {
			setTimeout(() => inputRef.current?.focus(), 0);
		} else {
			setSearch("");
		}
	}, [open]);

	const clientTagIds = new Set(clientTags.map((t) => t.id));
	const filtered = allTags
		.filter((t) => !clientTagIds.has(t.id))
		.filter((t) => t.name.toLowerCase().includes(search.toLowerCase()));
	const exactMatch = allTags.some((t) => t.name.toLowerCase() === search.toLowerCase());

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Manage Tags</DialogTitle>
				</DialogHeader>
				<div className="space-y-4">
					{clientTags.length > 0 && (
						<div className="space-y-2">
							<Label className="text-xs text-muted-foreground">Current tags</Label>
							<div className="flex flex-wrap gap-1.5">
								{clientTags.map((tag) => (
									<Badge
										key={tag.id}
										variant="secondary"
										className="gap-1 pr-1"
										style={tag.color ? { backgroundColor: `${tag.color}20`, color: tag.color, borderColor: `${tag.color}40` } : undefined}
									>
										{tag.name}
										<button
											type="button"
											className="ml-0.5 rounded-full p-0.5 hover:bg-black/10"
											onClick={() => remove.mutate(tag.id)}
										>
											<X className="h-3 w-3" />
										</button>
									</Badge>
								))}
							</div>
						</div>
					)}
					<div className="space-y-2">
						<Label className="text-xs text-muted-foreground">Search or create</Label>
						<Input
							ref={inputRef}
							placeholder="Type a tag name..."
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === "Enter" && search.trim() && !exactMatch) {
									createAndAssign.mutate(search.trim());
								}
							}}
							className="h-9"
						/>
					</div>
					{(filtered.length > 0 || (search.trim() && !exactMatch)) && (
						<div className="rounded-md border max-h-48 overflow-y-auto">
							{filtered.map((tag) => (
								<button
									key={tag.id}
									type="button"
									className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent text-left"
									onClick={() => assign.mutate(tag.id)}
								>
									{tag.color && (
										<span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: tag.color }} />
									)}
									{tag.name}
								</button>
							))}
							{search.trim() && !exactMatch && (
								<button
									type="button"
									className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent text-left text-muted-foreground"
									onClick={() => createAndAssign.mutate(search.trim())}
								>
									<Plus className="h-3.5 w-3.5" />
									Create "{search.trim()}"
								</button>
							)}
						</div>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}
