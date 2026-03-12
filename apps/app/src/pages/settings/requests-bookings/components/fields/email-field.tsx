import { Input } from "@/components/ui/input";
import type { FieldRendererProps } from "./types";

export function EmailField(_props: FieldRendererProps) {
	return (
		<>
			<Input type="email" placeholder="Email" disabled />
			<label className="flex items-start gap-2 mt-2">
				<input type="checkbox" disabled className="size-4 mt-0.5 shrink-0" />
				<span className="text-xs text-muted-foreground">
					I'd like to receive marketing emails from Pool Gen X. Unsubscribe at any time.
				</span>
			</label>
		</>
	);
}
