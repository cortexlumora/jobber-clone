import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
				<div className="flex items-center justify-between">
					<Label className="text-sm">Required</Label>
					<Switch
						checked={field.required ?? false}
						onCheckedChange={(checked) => onUpdate?.({ required: checked })}
					/>
				</div>
			</div>
		);
	}
	return (
		<div className="space-y-2">
			<Label>{field.label}</Label>
			<Input placeholder="" disabled />
			{field.required && <p className="text-xs text-muted-foreground">Required</p>}
		</div>
	);
}
