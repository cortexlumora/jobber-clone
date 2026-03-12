import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { FieldRendererProps } from "./types";

export function LongAnswerField({ field }: FieldRendererProps) {
	return (
		<div className="space-y-2">
			<Label>{field.label}</Label>
			<Textarea placeholder="" disabled rows={4} />
		</div>
	);
}
