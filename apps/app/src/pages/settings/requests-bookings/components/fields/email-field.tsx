import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { FieldRendererProps } from "./types";

export function EmailField({ field }: FieldRendererProps) {
	return (
		<div className="space-y-2">
			<Label>{field.label}</Label>
			<Input type="email" placeholder="Email" disabled />
		</div>
	);
}
