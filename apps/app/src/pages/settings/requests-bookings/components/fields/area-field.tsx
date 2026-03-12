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

const UNITS = ["sq ft", "sq m", "sq yd", "acres", "hectares"];

export function AreaField({ field, isEditing, onUpdate }: FieldRendererProps) {
	const unit = field.unit ?? "sq ft";

	if (isEditing) {
		return (
			<div className="space-y-3" onClick={(e) => e.stopPropagation()}>
				<div className="grid grid-cols-2 gap-4">
					<Input placeholder="Length" disabled />
					<Input placeholder="Width" disabled />
				</div>
				<div className="space-y-2">
					<Label className="text-sm">Unit</Label>
					<Select value={unit} onValueChange={(val) => onUpdate?.({ unit: val })}>
						<SelectTrigger className="w-full">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{UNITS.map((u) => (
								<SelectItem key={u} value={u}>{u}</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-2">
			<div className="grid grid-cols-2 gap-4">
				<Input placeholder="Length" disabled />
				<Input placeholder="Width" disabled />
			</div>
			<p className="text-xs text-muted-foreground">Unit: {unit}</p>
		</div>
	);
}
