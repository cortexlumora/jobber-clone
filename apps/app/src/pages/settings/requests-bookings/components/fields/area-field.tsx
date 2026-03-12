import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { FieldRendererProps } from "./types";

export function AreaField({ field }: FieldRendererProps) {
	return (
		<div className="space-y-2">
			<Label>{field.label}</Label>
			<div className="grid grid-cols-2 gap-4">
				<Input placeholder="Length" disabled />
				<Input placeholder="Width" disabled />
			</div>
			{field.required && <p className="text-xs text-muted-foreground">Required</p>}
		</div>
	);
}
