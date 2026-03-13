import type { ComponentProps } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

interface MultiInputFieldItem {
	id: string;
	type: string;
	onTypeChange: (value: string) => void;
	inputProps: ComponentProps<typeof Input>;
	onRemove: () => void;
}

interface MultiInputFieldProps {
	label: string;
	items: MultiInputFieldItem[];
	typeOptions: { value: string; label: string }[];
	error?: string;
	addLabel: string;
	onAdd: () => void;
}

export function MultiInputField({
	label,
	items,
	typeOptions,
	error,
	addLabel,
	onAdd,
}: MultiInputFieldProps) {
	return (
		<div className="space-y-2">
			<Label>{label}</Label>
			{items.map((item) => (
				<div key={item.id} className="flex gap-2">
					<div className="flex h-9 w-full rounded-md border border-input shadow-xs focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50">
						<Input
							className="border-0 shadow-none rounded-r-none focus-visible:ring-0 focus-visible:border-transparent"
							{...item.inputProps}
						/>
						<Select onValueChange={item.onTypeChange} value={item.type}>
							<SelectTrigger className="border-0 w-37.5 shadow-none rounded-l-none border-l border-input focus-visible:ring-0 focus-visible:border-input">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{typeOptions.map((opt) => (
									<SelectItem key={opt.value} value={opt.value}>
										{opt.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					{items.length > 1 && (
						<Button
							type="button"
							variant="ghost"
							size="icon"
							className="shrink-0"
							onClick={item.onRemove}
						>
							<Trash2 className="h-4 w-4" />
						</Button>
					)}
				</div>
			))}
			{error && (
				<p className="text-sm text-destructive">{error}</p>
			)}
			<Button type="button" variant="outline" size="sm" onClick={onAdd}>
				<Plus className="h-4 w-4 mr-1" />
				{addLabel}
			</Button>
		</div>
	);
}
