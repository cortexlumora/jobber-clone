import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Plus, X } from "lucide-react";
import type { FieldRendererProps } from "./types";

const DEFAULT_OPTIONS = ["Existing Client", "Google", "Facebook", "Referral", "Other"];

export function LeadSourceField({ field, isEditing, onUpdate }: FieldRendererProps) {
	const options = field.options ?? DEFAULT_OPTIONS;

	if (isEditing) {
		return (
			<div className="space-y-2" onClick={(e) => e.stopPropagation()}>
				<Select disabled>
					<SelectTrigger className="w-full">
						<SelectValue placeholder="Choose an option" />
					</SelectTrigger>
				</Select>
				<div className="space-y-2">
					{options.map((option, index) => (
						<div key={index} className="flex items-center gap-2">
							<span className="text-xs text-muted-foreground w-4 shrink-0">{index + 1}.</span>
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
				</div>
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
		<Select disabled>
			<SelectTrigger className="w-full">
				<SelectValue placeholder="Choose an option" />
			</SelectTrigger>
			<SelectContent>
				{options.map((option, index) => (
					<SelectItem key={index} value={`option-${index}`}>{option}</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
}
