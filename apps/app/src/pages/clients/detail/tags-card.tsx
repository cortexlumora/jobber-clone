import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { TagDTO } from "@repo/dto";
import { getTags, createTag, assignTagToClient, removeTagFromClient } from "../api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tag, X, Plus } from "lucide-react";

const TAG_COLORS = [
	"#3b82f6", "#ef4444", "#22c55e", "#f59e0b", "#8b5cf6",
	"#ec4899", "#06b6d4", "#f97316", "#6366f1", "#14b8a6",
];

interface TagsCardProps {
	clientId: string;
	initialTags: TagDTO[];
}

export default function TagsCard({ clientId, initialTags }: TagsCardProps) {
	const queryClient = useQueryClient();
	const [showInput, setShowInput] = useState(false);
	const [search, setSearch] = useState("");
	const [showDropdown, setShowDropdown] = useState(false);
	const inputRef = useRef<HTMLInputElement>(null);
	const containerRef = useRef<HTMLDivElement>(null);

	const clientTags = initialTags;

	const { data: allTags = [] } = useQuery({
		queryKey: ["tags"],
		queryFn: getTags,
		enabled: showInput,
	});

	const invalidate = () => {
		queryClient.invalidateQueries({ queryKey: ["client", clientId] });
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
		if (showInput) {
			inputRef.current?.focus();
		}
	}, [showInput]);

	useEffect(() => {
		function handleClickOutside(e: MouseEvent) {
			if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
				setShowInput(false);
				setShowDropdown(false);
				setSearch("");
			}
		}
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	const clientTagIds = new Set(clientTags.map((t) => t.id));
	const filtered = allTags
		.filter((t) => !clientTagIds.has(t.id))
		.filter((t) => t.name.toLowerCase().includes(search.toLowerCase()));
	const exactMatch = allTags.some((t) => t.name.toLowerCase() === search.toLowerCase());

	return (
		<Card className="gap-0 py-0">
			<CardHeader className="px-5 py-4">
				<div className="flex items-center justify-between">
					<CardTitle className="text-sm font-medium">Tags</CardTitle>
					<Button
						variant="ghost"
						size="sm"
						className="h-7 text-xs"
						onClick={() => {
							setShowInput(true);
							setShowDropdown(true);
						}}
					>
						<Tag className="h-3 w-3 mr-1" />
						New Tag
					</Button>
				</div>
			</CardHeader>
			<CardContent className="px-5 pb-4">
				{clientTags.length === 0 && !showInput && (
					<p className="text-sm text-muted-foreground">This client has no tags</p>
				)}
				{clientTags.length > 0 && (
					<div className="flex flex-wrap gap-1.5 mb-3">
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
				)}
				{showInput && (
					<div ref={containerRef} className="relative">
						<Input
							ref={inputRef}
							placeholder="Search or create tag..."
							value={search}
							onChange={(e) => {
								setSearch(e.target.value);
								setShowDropdown(true);
							}}
							onFocus={() => setShowDropdown(true)}
							onKeyDown={(e) => {
								if (e.key === "Enter" && search.trim() && !exactMatch) {
									createAndAssign.mutate(search.trim());
								}
								if (e.key === "Escape") {
									setShowInput(false);
									setShowDropdown(false);
									setSearch("");
								}
							}}
							className="h-8 text-sm"
						/>
						{showDropdown && (filtered.length > 0 || (search.trim() && !exactMatch)) && (
							<div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md max-h-48 overflow-y-auto">
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
				)}
			</CardContent>
		</Card>
	);
}
