import { useDroppable } from "@dnd-kit/core";

export function DropIndicator({ id, isDragging }: { id: string; isDragging: boolean }) {
	const { setNodeRef, isOver } = useDroppable({ id });

	if (!isDragging) return null;

	return (
		<div
			ref={setNodeRef}
			className={`rounded-md border-2 border-dashed transition-all ${
				isOver
					? "border-primary bg-primary/5 py-6"
					: "border-muted-foreground/20 py-2"
			}`}
		>
			{isOver && (
				<p className="text-xs text-primary text-center font-medium">Drop here</p>
			)}
		</div>
	);
}
