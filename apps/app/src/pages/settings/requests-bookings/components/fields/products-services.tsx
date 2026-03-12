import type { FieldRendererProps } from "./types";

export function ProductsServicesField(_props: FieldRendererProps) {
	return (
		<div className="rounded-lg border-2 border-dashed p-4 text-center">
			<p className="text-sm text-muted-foreground">Products and services will appear here</p>
		</div>
	);
}
