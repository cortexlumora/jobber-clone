import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { CustomFieldDefinitionDTO } from "@repo/dto";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CustomFieldDialog } from "@/components/custom-field-dialog";
import { getCustomFieldDefinitions, deleteCustomFieldDefinition } from "../api";
import {
	GripVertical,
	MoreHorizontal,
	X,
	Info,
	Trash2,
	Users,
	Home,
	FileText,
	Wrench,
	MessageSquare,
	Receipt,
	UserCircle,
} from "lucide-react";

const CATEGORIES = [
	{ key: "client", label: "Client custom fields", appliesToLabel: "All clients", emptyDesc: "Keep track of client details by adding a custom field", icon: Users },
	{ key: "property", label: "Property custom fields", appliesToLabel: "All properties", emptyDesc: "Keep track of property details by adding a custom field", icon: Home },
	{ key: "quote", label: "Quote custom fields", appliesToLabel: "All quotes", emptyDesc: "Keep track of quote details by adding a custom field", icon: FileText },
	{ key: "job", label: "Job custom fields", appliesToLabel: "All jobs", emptyDesc: "Keep track of job details by adding a custom field", icon: Wrench },
	{ key: "request", label: "Request custom fields", appliesToLabel: "All requests", emptyDesc: "Keep track of request details by adding a custom field", icon: MessageSquare },
	{ key: "invoice", label: "Invoice custom fields", appliesToLabel: "All invoices", emptyDesc: "Keep track of invoice details by adding a custom field", icon: Receipt },
	{ key: "team", label: "Team custom fields", appliesToLabel: "All team members", emptyDesc: "Keep track of user details by adding a custom field", icon: UserCircle },
] as const;

function getFieldDescription(field: CustomFieldDefinitionDTO): string {
	const typeLabel: Record<string, string> = {
		text: "a text value",
		number: "the number of",
		dropdown: "a dropdown value",
		checkbox: "a checkbox value",
		date: "a date value",
	};
	const base = `Stores ${typeLabel[field.fieldType] || "a value"}`;
	if (field.fieldType === "number" && field.defaultValue) {
		return `${base} ${field.defaultValue}`;
	}
	if (field.defaultValue) {
		return `${base} (default: "${field.defaultValue}")`;
	}
	return base;
}

const CustomFieldsPage = () => {
	const queryClient = useQueryClient();
	const [showTip, setShowTip] = useState(true);
	const [dialogOpen, setDialogOpen] = useState(false);
	const [dialogAppliesTo, setDialogAppliesTo] = useState<string>("client");
	const [dialogLabel, setDialogLabel] = useState("All clients");

	const { data: fields = [] } = useQuery<CustomFieldDefinitionDTO[]>({
		queryKey: ["custom-field-definitions"],
		queryFn: () => getCustomFieldDefinitions(),
	});

	const deleteMutation = useMutation({
		mutationFn: deleteCustomFieldDefinition,
		onSuccess: () => queryClient.invalidateQueries({ queryKey: ["custom-field-definitions"] }),
	});

	const openDialog = (appliesTo: string, label: string) => {
		setDialogAppliesTo(appliesTo);
		setDialogLabel(label);
		setDialogOpen(true);
	};

	const fieldsByCategory = (category: string) =>
		fields.filter((f) => f.appliesTo === category);

	return (
		<div className="max-w-3xl">
			<h2 className="text-2xl font-semibold mb-2">Custom fields</h2>
			<p className="text-sm text-muted-foreground mb-6">
				Track additional information specific to your business with custom fields.
			</p>

			{/* Info tip */}
			{showTip && (
				<div className="flex items-start gap-3 rounded-lg border bg-muted/50 p-4 mb-6">
					<Info className="size-5 text-muted-foreground shrink-0 mt-0.5" />
					<div className="flex-1">
						<p className="text-sm font-medium">Need to change the order of custom fields?</p>
						<p className="text-sm text-muted-foreground">
							Drag to rearrange the order that fields show up in Jobber
						</p>
					</div>
					<button
						onClick={() => setShowTip(false)}
						className="text-muted-foreground hover:text-foreground shrink-0"
					>
						<X className="size-4" />
					</button>
				</div>
			)}

			{/* Category sections */}
			<div className="space-y-6">
				{CATEGORIES.map((cat) => {
					const catFields = fieldsByCategory(cat.key);
					const Icon = cat.icon;

					return (
						<div key={cat.key} className="rounded-lg border">
							{/* Section header */}
							<div className="flex items-center justify-between p-4 pb-0">
								<h3 className="text-lg font-semibold">{cat.label}</h3>
								{catFields.length > 0 && (
									<Button
										variant="outline"
										size="sm"
										onClick={() => openDialog(cat.key, cat.appliesToLabel)}
									>
										Add Field
									</Button>
								)}
							</div>

							{/* Fields list */}
							<div className="p-4">
								{catFields.length === 0 ? (
									<div className="flex items-center gap-4 py-4">
										<div className="size-12 rounded-full bg-muted flex items-center justify-center shrink-0">
											<Icon className="size-5 text-muted-foreground" />
										</div>
										<div>
											<p className="text-sm font-medium">No custom fields</p>
											<p className="text-sm text-muted-foreground">{cat.emptyDesc}</p>
											<Button
												variant="outline"
												size="sm"
												className="mt-2"
												onClick={() => openDialog(cat.key, cat.appliesToLabel)}
											>
												Add Field
											</Button>
										</div>
									</div>
								) : (
									<div className="divide-y">
										{catFields.map((field) => (
											<div
												key={field.id}
												className="flex items-center gap-3 py-3 group"
											>
												<GripVertical className="size-5 text-muted-foreground/50 cursor-grab shrink-0" />
												<span className="text-sm font-medium text-primary min-w-0 truncate">
													{field.name}
												</span>
												<span className="text-sm text-muted-foreground flex-1 truncate">
													{getFieldDescription(field)}
												</span>
												<DropdownMenu>
													<DropdownMenuTrigger asChild>
														<Button
															variant="ghost"
															size="icon"
															className="size-8 shrink-0"
														>
															<MoreHorizontal className="size-4" />
														</Button>
													</DropdownMenuTrigger>
													<DropdownMenuContent align="end">
														<DropdownMenuItem
															className="text-destructive focus:text-destructive"
															onClick={() => deleteMutation.mutate(field.id)}
														>
															<Trash2 className="size-4 mr-2" />
															Delete
														</DropdownMenuItem>
													</DropdownMenuContent>
												</DropdownMenu>
											</div>
										))}
									</div>
								)}
							</div>
						</div>
					);
				})}
			</div>

			{/* Add Field Dialog */}
			<CustomFieldDialog
				open={dialogOpen}
				onOpenChange={setDialogOpen}
				appliesTo={dialogAppliesTo}
				appliesToLabel={dialogLabel}
			/>
		</div>
	);
};

export default CustomFieldsPage;
