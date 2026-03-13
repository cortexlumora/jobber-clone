import { useEffect } from "react";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createCustomFieldDefinition } from "@/pages/settings/api";
import type { CreateCustomFieldForm } from "@repo/zod/custom-field";
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

interface CustomFieldForm {
	appliesTo: string;
	transferable: boolean;
	name: string;
	fieldType: string;
	defaultValue: string;
	unit: string;
	defaultLength: string;
	defaultWidth: string;
	options: { value: string }[];
}

const DEFAULT_VALUES: CustomFieldForm = {
	appliesTo: "client",
	transferable: false,
	name: "",
	fieldType: "",
	defaultValue: "",
	unit: "",
	defaultLength: "",
	defaultWidth: "",
	options: [{ value: "" }, { value: "" }],
};

interface CustomFieldDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	appliesTo: string;
}

export function CustomFieldDialog({ open, onOpenChange, appliesTo: initialAppliesTo }: CustomFieldDialogProps) {
	const queryClient = useQueryClient();

	const { register, control, handleSubmit, watch, reset, setValue } = useForm<CustomFieldForm>({
		defaultValues: { ...DEFAULT_VALUES, appliesTo: initialAppliesTo },
	});

	const { fields: optionFields, append: appendOption, remove: removeOption } = useFieldArray({
		control,
		name: "options",
	});

	const fieldType = watch("fieldType");

	useEffect(() => {
		if (open) {
			reset({ ...DEFAULT_VALUES, appliesTo: initialAppliesTo });
		}
	}, [open, initialAppliesTo, reset]);

	const mutation = useMutation({
		mutationFn: createCustomFieldDefinition,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["custom-field-definitions"] });
			onOpenChange(false);
		},
	});

	const onSubmit = (data: CustomFieldForm) => {
		const payload: CreateCustomFieldForm = {
			name: data.name,
			fieldType: data.fieldType as CreateCustomFieldForm["fieldType"],
			appliesTo: data.appliesTo as CreateCustomFieldForm["appliesTo"],
			transferable: data.transferable,
		};

		if (data.fieldType === "text" || data.fieldType === "date") {
			if (data.defaultValue) payload.defaultValue = data.defaultValue;
		} else if (data.fieldType === "number") {
			if (data.defaultValue) payload.defaultValue = data.defaultValue;
			if (data.unit) payload.unit = data.unit;
		} else if (data.fieldType === "true_false") {
			if (data.defaultValue) payload.defaultValue = data.defaultValue;
		} else if (data.fieldType === "area") {
			const parts = [data.defaultLength || "0", data.defaultWidth || "0"];
			payload.defaultValue = parts.join("x");
			if (data.unit) payload.unit = data.unit;
		} else if (data.fieldType === "dropdown") {
			const filteredOptions = data.options.map((o) => o.value).filter((v) => v.trim());
			if (filteredOptions.length > 0) {
				payload.options = filteredOptions;
				payload.defaultValue = filteredOptions[0];
			}
		} else if (data.fieldType === "checkbox") {
			if (data.defaultValue) payload.defaultValue = data.defaultValue;
		}

		mutation.mutate(payload);
	};

	const handleOpenChange = (isOpen: boolean) => {
		onOpenChange(isOpen);
	};

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent className="max-w-lg">
				<DialogHeader>
					<DialogTitle>New Custom Field</DialogTitle>
				</DialogHeader>
				<form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
					{/* Applies to selector */}
					<div className="space-y-2">
						<Label>Applies to</Label>
						<Controller
							control={control}
							name="appliesTo"
							render={({ field }) => (
								<Select value={field.value} onValueChange={field.onChange}>
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
							)}
						/>
					</div>

					{/* Transferable checkbox */}
					<Controller
						control={control}
						name="transferable"
						render={({ field }) => (
							<div className="flex items-center gap-2">
								<Checkbox
									id="transferable"
									checked={field.value}
									onCheckedChange={field.onChange}
								/>
								<Label htmlFor="transferable" className="font-normal">
									Transferable field
								</Label>
							</div>
						)}
					/>

					{/* Custom field name */}
					<div className="space-y-2">
						<Label>Custom field name</Label>
						<Input
							placeholder="Serial Number"
							{...register("name")}
						/>
					</div>

					{/* Field type selector */}
					<div className="space-y-2">
						<Label>Field type</Label>
						<Controller
							control={control}
							name="fieldType"
							render={({ field }) => (
								<Select
									value={field.value}
									onValueChange={(val) => {
										field.onChange(val);
										setValue("defaultValue", "");
										setValue("unit", "");
										setValue("defaultLength", "");
										setValue("defaultWidth", "");
										setValue("options", [{ value: "" }, { value: "" }]);
									}}
								>
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
							)}
						/>
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
								<Input placeholder="54A17-HEX" {...register("defaultValue")} />
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
									<Input placeholder="0" type="number" {...register("defaultValue")} />
								</div>
								<div className="space-y-2">
									<Label>Unit</Label>
									<Input placeholder="ft" className="w-24" {...register("unit")} />
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
								<Controller
									control={control}
									name="defaultValue"
									render={({ field }) => (
										<Select value={field.value} onValueChange={field.onChange}>
											<SelectTrigger className="w-full">
												<SelectValue placeholder="Select default" />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="yes">Yes</SelectItem>
												<SelectItem value="no">No</SelectItem>
											</SelectContent>
										</Select>
									)}
								/>
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
										<Input placeholder="0" type="number" {...register("defaultLength")} />
									</div>
									<span className="text-muted-foreground text-sm pb-2.5">x</span>
									<div className="space-y-2">
										<Label className="text-xs">Width</Label>
										<Input placeholder="0" type="number" {...register("defaultWidth")} />
									</div>
									<div className="space-y-2">
										<Label className="text-xs">Unit</Label>
										<Input placeholder="ft" {...register("unit")} />
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
									{optionFields.map((field, index) => (
										<div key={field.id} className="flex items-center gap-2">
											<span className="text-sm text-muted-foreground w-6 shrink-0 text-right">{index + 1}.</span>
											<Input
												placeholder={index === 0 ? "Default option" : "Option"}
												{...register(`options.${index}.value`)}
											/>
											{optionFields.length > 2 && (
												<button
													type="button"
													onClick={() => removeOption(index)}
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
									onClick={() => appendOption({ value: "" })}
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
								<Input placeholder="Default value" {...register("defaultValue")} />
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
								<Input placeholder="Default value" {...register("defaultValue")} />
							</div>
						</>
					)}

					<p className="text-xs text-muted-foreground">
						All custom fields can be edited and reordered in{" "}
						<Link to="/settings/custom-fields" className="text-primary underline">
							Settings &gt; Custom Fields.
						</Link>
					</p>

					<DialogFooter>
						<Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
							Cancel
						</Button>
						<Button
							type="submit"
							disabled={!watch("name") || !fieldType || mutation.isPending}
						>
							{mutation.isPending ? "Creating..." : "Create Custom Field"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
