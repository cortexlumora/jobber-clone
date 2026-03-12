import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import type { FieldRendererProps } from "./types";

export function LeadSourceField({ field }: FieldRendererProps) {
	return (
		<div className="space-y-2">
			<Label>{field.label}</Label>
			<Select disabled>
				<SelectTrigger>
					<SelectValue placeholder="Choose an option" />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="existing_client">Existing Client</SelectItem>
				</SelectContent>
			</Select>
		</div>
	);
}
