import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { FieldRendererProps } from "./types";

export function YesNoField({ field }: FieldRendererProps) {
	return (
		<div className="space-y-2">
			<Label>{field.label}</Label>
			<div className="flex items-center gap-3">
				<Button variant="outline" size="sm" disabled>Yes</Button>
				<Button variant="outline" size="sm" disabled>No</Button>
			</div>
		</div>
	);
}
