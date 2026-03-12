import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, X } from "lucide-react";
import type { FieldRendererProps } from "./types";

export function CheckboxField({ field, isEditing, onUpdate }: FieldRendererProps) {
	const options = field.options ?? ["Option"];

	if (isEditing) {
		return (
			<div className="space-y-2" onClick={(e) => e.stopPropagation()}>
				{options.map((option, index) => (
					<div key={index} className="flex items-center gap-2">
						<input type="checkbox" disabled className="size-4 shrink-0" />
						<Input
							value={option}
							onChange={(e) => {
								const newOptions = [...options];
								newOptions[index] = e.target.value;
								onUpdate?.({ options: newOptions });
							}}
							placeholder={`Option ${index + 1}`}
						/>
						{options.length > 1 && (
							<button
								onClick={() => onUpdate?.({ options: options.filter((_, i) => i !== index) })}
								className="p-1 rounded-md text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
							>
								<X className="size-4" />
							</button>
						)}
					</div>
				))}
				<Button
					variant="ghost"
					size="sm"
					className="text-xs"
					onClick={() => onUpdate?.({ options: [...options, `Option ${options.length + 1}`] })}
				>
					<Plus className="size-3 mr-1" />
					Add option
				</Button>
			</div>
		);
	}

	return (
		<div className="space-y-2">
			{options.map((option, index) => (
				<label key={index} className="flex items-center gap-2">
					<input type="checkbox" disabled className="size-4" />
					<span className="text-sm text-muted-foreground">{option}</span>
				</label>
			))}
		</div>
	);
}
