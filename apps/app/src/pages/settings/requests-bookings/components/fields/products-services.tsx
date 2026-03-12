import { Label } from "@/components/ui/label";
import type { FieldRendererProps } from "./types";

export function ProductsServicesField({ field }: FieldRendererProps) {
	return (
		<div className="space-y-2">
			<Label>{field.label}</Label>
			<div className="rounded-lg border-2 border-dashed p-4 text-center">
				<p className="text-sm text-muted-foreground">Products and services will appear here</p>
			</div>
		</div>
	);
}
