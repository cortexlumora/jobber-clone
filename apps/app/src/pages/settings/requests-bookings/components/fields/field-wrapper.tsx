import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { GripVertical, Trash2 } from "lucide-react";
import { FieldRenderer } from "./field-renderer";
import type { FormField } from "./types";

interface FieldWrapperProps {
	field: FormField;
	isEditing: boolean;
	onSelect: () => void;
	onUpdate: (updates: Partial<FormField>) => void;
	onDelete: () => void;
	onDeselect: () => void;
}

function FieldWrapperRoot({
	field,
	isEditing,
	onSelect,
	onUpdate,
	onDelete,
	onDeselect,
}: FieldWrapperProps) {
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({ id: field.id, data: { type: "field" } });

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
		opacity: isDragging ? 0.5 : 1,
	};

	return (
		<div
			ref={setNodeRef}
			style={style}
			className={`flex items-start gap-2 rounded-lg p-3 -mx-3 cursor-pointer transition-all ${isEditing ? "ring-2 ring-primary bg-primary/5 shadow-sm" : "hover:bg-accent/20"}`}
			onClick={(e) => { e.stopPropagation(); onSelect(); }}
		>
			<FieldWrapper.Content field={field} isEditing={isEditing} onUpdate={onUpdate} onDeselect={onDeselect} />
			<FieldWrapper.Actions
				isEditing={isEditing}
				onDelete={onDelete}
				listeners={listeners}
				attributes={attributes}
			/>
		</div>
	);
}

function FieldWrapperContent({
	field,
	isEditing,
	onUpdate,
	onDeselect,
}: {
	field: FormField;
	isEditing: boolean;
	onUpdate: (updates: Partial<FormField>) => void;
	onDeselect: () => void;
}) {
	return (
		<div className="flex-1 min-w-0 space-y-2">
			{isEditing ? (
				<div className="space-y-2" onClick={(e) => e.stopPropagation()}>
					<Label className="text-xs text-muted-foreground">Question title</Label>
					<Input
						value={field.label}
						onChange={(e) => onUpdate({ label: e.target.value })}
						onKeyDown={(e) => { if (e.key === "Enter") onDeselect(); }}
						placeholder="Enter question title"
						autoFocus
					/>
				</div>
			) : (
				<Label>{field.label}</Label>
			)}
			<FieldRenderer field={field} isEditing={isEditing} onUpdate={onUpdate} />
			{isEditing && (
				<div className="flex items-center justify-between mt-3 pt-3 border-t" onClick={(e) => e.stopPropagation()}>
					<Label className="text-sm">Required</Label>
					<Switch
						checked={field.required ?? false}
						onCheckedChange={(checked) => onUpdate({ required: checked })}
					/>
				</div>
			)}
			{!isEditing && field.required && (
				<p className="text-xs text-muted-foreground mt-1">Required</p>
			)}
		</div>
	);
}

function FieldWrapperActions({
	isEditing,
	onDelete,
	listeners,
	attributes,
}: {
	isEditing: boolean;
	onDelete: () => void;
	listeners: ReturnType<typeof useSortable>["listeners"];
	attributes: ReturnType<typeof useSortable>["attributes"];
}) {
	return (
		<div className="flex flex-col items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
			<div {...listeners} {...attributes} className="cursor-grab">
				<GripVertical className="size-5 text-muted-foreground/50" />
			</div>
			{isEditing && (
				<button
					onClick={onDelete}
					className="p-1 rounded-md text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 transition-colors"
				>
					<Trash2 className="size-4" />
				</button>
			)}
		</div>
	);
}

export const FieldWrapper = Object.assign(FieldWrapperRoot, {
	Content: FieldWrapperContent,
	Actions: FieldWrapperActions,
});
