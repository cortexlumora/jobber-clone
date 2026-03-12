import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import type { FieldRendererProps } from "./types";

export function LeadSourceField(_props: FieldRendererProps) {
	return (
		<Select disabled>
			<SelectTrigger>
				<SelectValue placeholder="Choose an option" />
			</SelectTrigger>
			<SelectContent>
				<SelectItem value="existing_client">Existing Client</SelectItem>
			</SelectContent>
		</Select>
	);
}
