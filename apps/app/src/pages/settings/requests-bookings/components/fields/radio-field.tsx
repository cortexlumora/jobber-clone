import type { FieldRendererProps } from "./types";

export function RadioField(_props: FieldRendererProps) {
	return (
		<div className="space-y-2">
			<label className="flex items-center gap-2">
				<input type="radio" disabled className="size-4" />
				<span className="text-sm text-muted-foreground">Option 1</span>
			</label>
			<label className="flex items-center gap-2">
				<input type="radio" disabled className="size-4" />
				<span className="text-sm text-muted-foreground">Option 2</span>
			</label>
		</div>
	);
}
