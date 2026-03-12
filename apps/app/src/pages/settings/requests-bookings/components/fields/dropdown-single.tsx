import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import type { FieldRendererProps } from "./types";

export function DropdownSingleField(_props: FieldRendererProps) {
	return (
		<Select disabled>
			<SelectTrigger className="w-full">
				<SelectValue placeholder="Choose an option" />
			</SelectTrigger>
			<SelectContent>
				<SelectItem value="option1">Option 1</SelectItem>
			</SelectContent>
		</Select>
	);
}
