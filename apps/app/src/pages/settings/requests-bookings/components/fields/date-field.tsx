import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { FieldRendererProps } from "./types";

export function DateField({ field }: FieldRendererProps) {
	return (
		<div className="space-y-2">
			<Label>{field.label}</Label>
			<Input type="date" disabled />
			{field.required && <p className="text-xs text-muted-foreground">Required</p>}
		</div>
	);
}
