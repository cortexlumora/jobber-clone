import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import type { FieldRendererProps } from "./types";

export function DropdownMultiField({ field }: FieldRendererProps) {
	return (
		<div className="space-y-2">
			<Label>{field.label}</Label>
			<Select disabled>
				<SelectTrigger>
					<SelectValue placeholder="Select options" />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="option1">Option 1</SelectItem>
				</SelectContent>
			</Select>
		</div>
	);
}
