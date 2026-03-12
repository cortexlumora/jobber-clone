import { Input } from "@/components/ui/input";
import type { FieldRendererProps } from "./types";

export function AreaField(_props: FieldRendererProps) {
	return (
		<div className="grid grid-cols-2 gap-4">
			<Input placeholder="Length" disabled />
			<Input placeholder="Width" disabled />
		</div>
	);
}
