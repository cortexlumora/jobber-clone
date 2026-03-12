import { Label } from "@/components/ui/label";
import type { FieldRendererProps } from "./types";

export function CheckboxField({ field }: FieldRendererProps) {
	return (
		<div className="space-y-2">
			<Label>{field.label}</Label>
			<div className="flex items-center gap-2">
				<input type="checkbox" disabled className="size-4" />
				<span className="text-sm text-muted-foreground">Option</span>
			</div>
			{field.required && <p className="text-xs text-muted-foreground">Required</p>}
		</div>
	);
}
