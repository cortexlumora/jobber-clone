import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { FieldRendererProps } from "./types";

export function ShortAnswerField({ field, isEditing, onUpdate }: FieldRendererProps) {
	if (isEditing) {
		return (
			<div className="space-y-3" onClick={(e) => e.stopPropagation()}>
				<div className="space-y-2">
					<Label className="text-xs text-muted-foreground">Question title</Label>
					<Input
						value={field.label}
						onChange={(e) => onUpdate?.({ label: e.target.value })}
						placeholder="Enter question title"
						autoFocus
					/>
				</div>
				<Input placeholder="Short answer" disabled />
			</div>
		);
	}
	return (
		<div className="space-y-2">
			<Label>{field.label}</Label>
			<Input placeholder="" disabled />
		</div>
	);
}
