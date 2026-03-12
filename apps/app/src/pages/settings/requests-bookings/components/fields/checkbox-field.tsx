import type { FieldRendererProps } from "./types";

export function CheckboxField(_props: FieldRendererProps) {
	return (
		<div className="flex items-center gap-2">
			<input type="checkbox" disabled className="size-4" />
			<span className="text-sm text-muted-foreground">Option</span>
		</div>
	);
}
