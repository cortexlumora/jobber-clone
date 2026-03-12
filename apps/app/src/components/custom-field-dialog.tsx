import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createCustomFieldDefinition } from "@/pages/settings/api";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { X } from "lucide-react";
import { Link } from "react-router";

const APPLIES_TO_OPTIONS = [
	{ value: "client", label: "All clients" },
	{ value: "property", label: "All properties" },
	{ value: "quote", label: "All quotes" },
	{ value: "job", label: "All jobs" },
	{ value: "request", label: "All requests" },
	{ value: "invoice", label: "All invoices" },
	{ value: "team", label: "All team members" },
];

interface CustomFieldDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	appliesTo: string;
	appliesToLabel: string;
}

export function CustomFieldDialog({ open, onOpenChange, appliesTo: initialAppliesTo, appliesToLabel }: CustomFieldDialogProps) {
	const queryClient = useQueryClient();
	const [appliesTo, setAppliesTo] = useState(initialAppliesTo);
	const [transferable, setTransferable] = useState(false);
	const [name, setName] = useState("");
	const [fieldType, setFieldType] = useState("");
	const [defaultValue, setDefaultValue] = useState("");
	const [unit, setUnit] = useState("");
	const [defaultLength, setDefaultLength] = useState("");
	const [defaultWidth, setDefaultWidth] = useState("");
	const [options, setOptions] = useState<string[]>(["", ""]);

	const resetForm = () => {
		setName("");
		setFieldType("");
		setDefaultValue("");
		setUnit("");
		setDefaultLength("");
		setDefaultWidth("");
		setOptions(["", ""]);
		setTransferable(false);
	};

	const mutation = useMutation({
		mutationFn: createCustomFieldDefinition,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["custom-field-definitions"] });
			onOpenChange(false);
			resetForm();
		},
	});

	const handleSubmit = () => {
		if (!name || !fieldType) return;

		const payload: Record<string, unknown> = {
			name,
			fieldType,
			appliesTo,
			transferable,
		};

		if (fieldType === "text" || fieldType === "date") {
			if (defaultValue) payload.defaultValue = defaultValue;
		} else if (fieldType === "number") {
			if (defaultValue) payload.defaultValue = defaultValue;
			if (unit) payload.unit = unit;
		} else if (fieldType === "true_false") {
			if (defaultValue) payload.defaultValue = defaultValue;
		} else if (fieldType === "area") {
			const parts = [defaultLength || "0", defaultWidth || "0"];
			payload.defaultValue = parts.join("x");
			if (unit) payload.unit = unit;
		} else if (fieldType === "dropdown") {
			const filteredOptions = options.filter((o) => o.trim());
			if (filteredOptions.length > 0) {
				payload.options = filteredOptions;
				payload.defaultValue = filteredOptions[0];
			}
		} else if (fieldType === "checkbox") {
			if (defaultValue) payload.defaultValue = defaultValue;
		}

		mutation.mutate(payload as any);
	};

	// Sync appliesTo when dialog opens with new value
	const handleOpenChange = (open: boolean) => {
		if (open) {
			setAppliesTo(initialAppliesTo);
		} else {
			resetForm();
		}
		onOpenChange(open);
	};

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent className="max-w-lg">
				<DialogHeader>
					<DialogTitle>New Custom Field</DialogTitle>
				</DialogHeader>
				<div className="space-y-4 py-2">
					{/* Applies to selector */}
					<div className="space-y-2">
						<Label>Applies to</Label>
						<Select value={appliesTo} onValueChange={setAppliesTo}>
							<SelectTrigger className="w-full">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{APPLIES_TO_OPTIONS.map((opt) => (
									<SelectItem key={opt.value} value={opt.value}>
										{opt.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					{/* Transferable checkbox */}
					<div className="flex items-center gap-2">
						<Checkbox
							id="transferable"
							checked={transferable}
							onCheckedChange={(checked) => setTransferable(checked === true)}
						/>
						<Label htmlFor="transferable" className="font-normal">
							Transferable field
						</Label>
					</div>

					{/* Custom field name */}
					<div className="space-y-2">
						<Label>Custom field name</Label>
						<Input
							placeholder="Serial Number"
							value={name}
							onChange={(e) => setName(e.target.value)}
						/>
					</div>

					{/* Field type selector */}
					<div className="space-y-2">
					<Label>Field type</Label>
					<Select value={fieldType} onValueChange={(val) => {
						setFieldType(val);
						setDefaultValue("");
						setUnit("");
						setDefaultLength("");
						setDefaultWidth("");
						setOptions(["", ""]);
					}}>
						<SelectTrigger className="w-full">
							<SelectValue placeholder="Select field type" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="text">Text</SelectItem>
							<SelectItem value="number">Numeric</SelectItem>
							<SelectItem value="true_false">True/False</SelectItem>
							<SelectItem value="dropdown">Dropdown</SelectItem>
							<SelectItem value="area">Area (length x width)</SelectItem>
							<SelectItem value="checkbox">Checkbox</SelectItem>
							<SelectItem value="date">Date</SelectItem>
						</SelectContent>
					</Select>
					</div>

					{/* Type-specific example and fields */}
					{fieldType === "text" && (
						<>
							<p className="text-sm text-muted-foreground">
								Example: Serial Number{" "}
								<code className="bg-muted px-1.5 py-0.5 rounded text-xs">54A17-HEX</code>
							</p>
							<div className="space-y-2">
								<Label>Default value</Label>
								<Input
									placeholder="54A17-HEX"
									value={defaultValue}
									onChange={(e) => setDefaultValue(e.target.value)}
								/>
							</div>
						</>
					)}

					{fieldType === "number" && (
						<>
							<p className="text-sm text-muted-foreground">
								Example: Pool Depth{" "}
								<code className="bg-muted px-1.5 py-0.5 rounded text-xs">11</code>{" "}
								ft
							</p>
							<div className="grid grid-cols-[1fr_auto] gap-2">
								<div className="space-y-2">
									<Label>Default value</Label>
									<Input
										placeholder="0"
										type="number"
										value={defaultValue}
										onChange={(e) => setDefaultValue(e.target.value)}
									/>
								</div>
								<div className="space-y-2">
									<Label>Unit</Label>
									<Input
										placeholder="ft"
										className="w-24"
										value={unit}
										onChange={(e) => setUnit(e.target.value)}
									/>
								</div>
							</div>
						</>
					)}

					{fieldType === "true_false" && (
						<>
							<p className="text-sm text-muted-foreground flex items-center gap-1.5">
								Example:{" "}
								<Checkbox checked disabled className="size-4" />{" "}
								Dog?
							</p>
							<div className="space-y-2">
							<Label>Default value</Label>
							<Select value={defaultValue} onValueChange={setDefaultValue}>
								<SelectTrigger className="w-full">
									<SelectValue placeholder="Select default" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="yes">Yes</SelectItem>
									<SelectItem value="no">No</SelectItem>
								</SelectContent>
							</Select>
							</div>
						</>
					)}

					{fieldType === "area" && (
						<>
							<p className="text-sm text-muted-foreground">
								Example: Yard Size{" "}
								<code className="bg-muted px-1.5 py-0.5 rounded text-xs">50</code>{" "}
								x{" "}
								<code className="bg-muted px-1.5 py-0.5 rounded text-xs">75</code>{" "}
								ft
							</p>
							<div>
								<Label className="text-sm font-medium mb-2 block">Default values</Label>
								<div className="grid grid-cols-[1fr_auto_1fr_1fr] gap-2 items-end">
									<div className="space-y-2">
										<Label className="text-xs">Length</Label>
										<Input
											placeholder="0"
											type="number"
											value={defaultLength}
											onChange={(e) => setDefaultLength(e.target.value)}
										/>
									</div>
									<span className="text-muted-foreground text-sm pb-2.5">x</span>
									<div className="space-y-2">
										<Label className="text-xs">Width</Label>
										<Input
											placeholder="0"
											type="number"
											value={defaultWidth}
											onChange={(e) => setDefaultWidth(e.target.value)}
										/>
									</div>
									<div className="space-y-2">
										<Label className="text-xs">Unit</Label>
										<Input
											placeholder="ft"
											value={unit}
											onChange={(e) => setUnit(e.target.value)}
										/>
									</div>
								</div>
							</div>
						</>
					)}

					{fieldType === "dropdown" && (
						<>
							<p className="text-sm text-muted-foreground">
								Example: Work Type{" "}
								<code className="bg-muted px-1.5 py-0.5 rounded text-xs">Commercial</code>
							</p>
							<div>
								<Label className="text-sm font-medium mb-2 block">Options for dropdown</Label>
								<div className="space-y-2">
									{options.map((option, index) => (
										<div key={index} className="flex items-center gap-2">
											<span className="text-sm text-muted-foreground w-6 shrink-0 text-right">{index + 1}.</span>
											<Input
												placeholder={index === 0 ? "Default option" : "Option"}
												value={option}
												onChange={(e) => {
													const newOptions = [...options];
													newOptions[index] = e.target.value;
													setOptions(newOptions);
												}}
											/>
											{options.length > 2 && (
												<button
													type="button"
													onClick={() => setOptions(options.filter((_, i) => i !== index))}
													className="p-1 text-muted-foreground hover:text-destructive shrink-0"
												>
													<X className="size-4" />
												</button>
											)}
										</div>
									))}
								</div>
								<Button
									variant="outline"
									size="sm"
									className="mt-2"
									type="button"
									onClick={() => setOptions([...options, ""])}
								>
									Add Another Option
								</Button>
							</div>
						</>
					)}

					{fieldType === "checkbox" && (
						<>
							<p className="text-sm text-muted-foreground">
								Example: Approved{" "}
								<Checkbox checked disabled className="size-4 align-middle" />
							</p>
							<div className="space-y-2">
								<Label>Default value</Label>
								<Input
									placeholder="Default value"
									value={defaultValue}
									onChange={(e) => setDefaultValue(e.target.value)}
								/>
							</div>
						</>
					)}

					{fieldType === "date" && (
						<>
							<p className="text-sm text-muted-foreground">
								Example: Start Date
							</p>
							<div className="space-y-2">
								<Label>Default value</Label>
								<Input
									placeholder="Default value"
									value={defaultValue}
									onChange={(e) => setDefaultValue(e.target.value)}
								/>
							</div>
						</>
					)}

					<p className="text-xs text-muted-foreground">
						All custom fields can be edited and reordered in{" "}
						<Link to="/settings/custom-fields" className="text-primary underline">
							Settings &gt; Custom Fields.
						</Link>
					</p>
				</div>
				<DialogFooter>
					<Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
						Cancel
					</Button>
					<Button
						type="button"
						disabled={!name || !fieldType || mutation.isPending}
						onClick={handleSubmit}
					>
						{mutation.isPending ? "Creating..." : "Create Custom Field"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
