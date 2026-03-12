import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { FieldRendererProps } from "./types";

export function NameGroupField(_props: FieldRendererProps) {
	return (
		<div className="grid grid-cols-2 gap-4">
			<div className="space-y-2">
				<Label>First name</Label>
				<Input placeholder="First name" disabled />
			</div>
			<div className="space-y-2">
				<Label>Last name</Label>
				<Input placeholder="Last name" disabled />
			</div>
		</div>
	);
}
