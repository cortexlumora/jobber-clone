import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import type { FieldRendererProps } from "./types";

export function AddressField(_props: FieldRendererProps) {
	return (
		<div className="space-y-4">
			<Input placeholder="Street address" disabled />
			<Input placeholder="Unit, apartment, suite, etc. (optional)" disabled />
			<div className="space-y-2">
				<Label>City</Label>
				<Input placeholder="City" disabled />
			</div>
			<div className="grid grid-cols-2 gap-4">
				<div className="space-y-2">
					<Label>State</Label>
					<Select disabled>
						<SelectTrigger>
							<SelectValue placeholder="Choose an option" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="AL">Alabama</SelectItem>
						</SelectContent>
					</Select>
				</div>
				<div className="space-y-2">
					<Label>ZIP Code</Label>
					<Input placeholder="ZIP Code" disabled />
				</div>
			</div>
		</div>
	);
}
