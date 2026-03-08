import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createCustomFieldDefinition } from "@/lib/api";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
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

interface CustomFieldDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	appliesTo: string;
	appliesToLabel: string;
}

export function CustomFieldDialog({ open, onOpenChange, appliesTo, appliesToLabel }: CustomFieldDialogProps) {
	const queryClient = useQueryClient();
	const [name, setName] = useState("");
	const [fieldType, setFieldType] = useState("");
	const [defaultValue, setDefaultValue] = useState("");

	const mutation = useMutation({
		mutationFn: createCustomFieldDefinition,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["custom-field-definitions"] });
			onOpenChange(false);
			setName("");
			setFieldType("");
			setDefaultValue("");
		},
	});

	const handleSubmit = () => {
		if (!name || !fieldType) return;
		mutation.mutate({
			name,
			fieldType: fieldType as "text" | "number" | "dropdown" | "checkbox" | "date",
			appliesTo: appliesTo as "client" | "property" | "request" | "job" | "quote",
			defaultValue: defaultValue || undefined,
		});
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>New custom field</DialogTitle>
				</DialogHeader>
				<div className="space-y-4 py-2">
					<div className="space-y-1">
						<Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Applies to</Label>
						<p className="text-sm font-medium">{appliesToLabel}</p>
					</div>
					<p className="text-sm text-muted-foreground">Transferable fields appear in multiple places and follow your workflow</p>
					<div className="space-y-2">
						<Label>Custom field name</Label>
						<Input placeholder="Serial Number" value={name} onChange={(e) => setName(e.target.value)} />
					</div>
					<div className="space-y-2">
						<Label>Field type</Label>
						<Select value={fieldType} onValueChange={setFieldType}>
							<SelectTrigger className="w-full"><SelectValue placeholder="Select field type" /></SelectTrigger>
							<SelectContent>
								<SelectItem value="text">Text</SelectItem>
								<SelectItem value="number">Number</SelectItem>
								<SelectItem value="dropdown">Dropdown</SelectItem>
								<SelectItem value="checkbox">Checkbox</SelectItem>
								<SelectItem value="date">Date</SelectItem>
							</SelectContent>
						</Select>
					</div>
					<div className="space-y-2">
						<Label>Default value</Label>
						<Input placeholder="54A17-HEX" value={defaultValue} onChange={(e) => setDefaultValue(e.target.value)} />
					</div>
					<p className="text-xs text-muted-foreground">All custom fields can be edited and reordered in Settings &gt; Custom Fields</p>
				</div>
				<DialogFooter>
					<Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
					<Button type="button" disabled={!name || !fieldType || mutation.isPending} onClick={handleSubmit}>
						{mutation.isPending ? "Adding..." : "Add Custom Field"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
