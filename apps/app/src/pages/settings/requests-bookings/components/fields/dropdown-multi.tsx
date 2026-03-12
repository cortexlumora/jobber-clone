import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import type { FieldRendererProps } from "./types";

export function DropdownMultiField(_props: FieldRendererProps) {
	return (
		<Select disabled>
			<SelectTrigger className="w-full">
				<SelectValue placeholder="Select options" />
			</SelectTrigger>
			<SelectContent>
				<SelectItem value="option1">Option 1</SelectItem>
			</SelectContent>
		</Select>
	);
}
