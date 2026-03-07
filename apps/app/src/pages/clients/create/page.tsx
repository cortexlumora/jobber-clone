import { useState } from "react";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClientSchema, type CreateClientForm } from "@repo/zod/client";
import { createClient, getCustomFieldDefinitions, createCustomFieldDefinition } from "@/lib/api";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

const CreateClientPage = () => {
	const navigate = useNavigate();
	const queryClient = useQueryClient();

	const mutation = useMutation({
		mutationFn: createClient,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["clients"] });
			navigate("/clients");
		},
	});

	const { data: customFields = [] } = useQuery({
		queryKey: ["custom-field-definitions", "client"],
		queryFn: () => getCustomFieldDefinitions("client"),
	});

	const createFieldMutation = useMutation({
		mutationFn: createCustomFieldDefinition,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["custom-field-definitions", "client"] });
		},
	});

	const {
		register,
		handleSubmit,
		control,
		watch,
		setValue,
		formState: { errors },
	} = useForm<CreateClientForm>({
		resolver: zodResolver(createClientSchema),
		defaultValues: {
			title: "none",
			useCompanyAsPrimary: false,
			phones: [{ type: "mobile", number: "" }],
			emails: [{ type: "primary", value: "" }],
			propertyAddress: {},
			billingSameAsProperty: true,
			billingAddress: {},
			notifications: {
				quoteFollowUp: true,
				appointmentReminders: true,
				jobFollowUp: true,
				invoiceFollowUp: true,
			},
		},
	});

	const billingSameAsProperty = watch("billingSameAsProperty");
	const [customFieldDialogOpen, setCustomFieldDialogOpen] = useState(false);
	const [customFieldName, setCustomFieldName] = useState("");
	const [customFieldType, setCustomFieldType] = useState<string>("");
	const [customFieldDefault, setCustomFieldDefault] = useState("");
	const [commDialogOpen, setCommDialogOpen] = useState(false);
	const [commState, setCommState] = useState({
		quoteFollowUp: true,
		appointmentReminders: true,
		jobFollowUp: true,
		invoiceFollowUp: true,
	});

	const {
		fields: phoneFields,
		append: appendPhone,
		remove: removePhone,
	} = useFieldArray({ control, name: "phones" });

	const {
		fields: emailFields,
		append: appendEmail,
		remove: removeEmail,
	} = useFieldArray({ control, name: "emails" });

	const onSubmit = (data: CreateClientForm) => {
		mutation.mutate(data);
	};

	const handleAddCustomField = () => {
		if (!customFieldName || !customFieldType) return;
		createFieldMutation.mutate(
			{
				name: customFieldName,
				fieldType: customFieldType as "text" | "number" | "dropdown" | "checkbox" | "date",
				appliesTo: "client",
				defaultValue: customFieldDefault || undefined,
			},
			{
				onSuccess: () => {
					setCustomFieldDialogOpen(false);
					setCustomFieldName("");
					setCustomFieldType("");
					setCustomFieldDefault("");
				},
			}
		);
	};

	return (
		<div className="max-w-2xl mx-auto">
			<h2 className="text-2xl font-semibold mt-8 mb-8">Create Client</h2>
			<form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
				{/* Name Section */}
				<div className="space-y-4">
					<div className="grid grid-cols-[120px_1fr_1fr] gap-4">
						<div className="space-y-2">
							<Label>Title</Label>
							<Controller
								control={control}
								name="title"
								render={({ field }) => (
									<Select onValueChange={field.onChange} value={field.value}>
										<SelectTrigger>
											<SelectValue placeholder="Title" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="none">None</SelectItem>
											<SelectItem value="Mr.">Mr.</SelectItem>
											<SelectItem value="Ms.">Ms.</SelectItem>
											<SelectItem value="Mrs.">Mrs.</SelectItem>
											<SelectItem value="Miss.">Miss.</SelectItem>
											<SelectItem value="Dr.">Dr.</SelectItem>
										</SelectContent>
									</Select>
								)}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="firstName">First Name</Label>
							<Input id="firstName" placeholder="John" {...register("firstName")} />
							{errors.firstName && (
								<p className="text-sm text-destructive">{errors.firstName.message}</p>
							)}
						</div>
						<div className="space-y-2">
							<Label htmlFor="lastName">Last Name</Label>
							<Input id="lastName" placeholder="Smith" {...register("lastName")} />
							{errors.lastName && (
								<p className="text-sm text-destructive">{errors.lastName.message}</p>
							)}
						</div>
					</div>
					<div className="space-y-2">
						<Label htmlFor="companyName">Company Name</Label>
						<Input id="companyName" placeholder="Acme Inc." {...register("companyName")} />
					</div>
					<Controller
						control={control}
						name="useCompanyAsPrimary"
						render={({ field }) => (
							<div className="flex items-center gap-2">
								<Checkbox
									id="useCompanyAsPrimary"
									checked={field.value}
									onCheckedChange={field.onChange}
								/>
								<Label htmlFor="useCompanyAsPrimary" className="font-normal">
									Use company name as the primary name
								</Label>
							</div>
						)}
					/>
				</div>

				{/* Contact Details */}
				<div className="space-y-4">
					<h3 className="text-lg font-medium">Contact Details</h3>

					{/* Phone Numbers */}
					<div className="space-y-2">
						<Label>Phone</Label>
						{phoneFields.map((field, index) => (
							<div key={field.id} className="flex gap-2">
								<Controller
									control={control}
									name={`phones.${index}.type`}
									render={({ field }) => (
										<Select onValueChange={field.onChange} value={field.value}>
											<SelectTrigger className="w-[140px]">
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="mobile">Mobile</SelectItem>
												<SelectItem value="landline">Landline</SelectItem>
											</SelectContent>
										</Select>
									)}
								/>
								<Input
									placeholder="(555) 123-4567"
									{...register(`phones.${index}.number`)}
								/>
								{phoneFields.length > 1 && (
									<Button
										type="button"
										variant="ghost"
										size="icon"
										onClick={() => removePhone(index)}
									>
										<Trash2 className="h-4 w-4" />
									</Button>
								)}
							</div>
						))}
						{errors.phones && (
							<p className="text-sm text-destructive">
								{errors.phones.root?.message || "Please check phone numbers"}
							</p>
						)}
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={() => appendPhone({ type: "mobile", number: "" })}
						>
							<Plus className="h-4 w-4 mr-1" />
							Add Phone
						</Button>
					</div>

					{/* Emails */}
					<div className="space-y-2">
						<Label>Email</Label>
						{emailFields.map((field, index) => (
							<div key={field.id} className="flex gap-2">
								<Controller
									control={control}
									name={`emails.${index}.type`}
									render={({ field }) => (
										<Select onValueChange={field.onChange} value={field.value}>
											<SelectTrigger className="w-35">
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="primary">Primary</SelectItem>
												<SelectItem value="secondary">Secondary</SelectItem>
												<SelectItem value="work">Work</SelectItem>
												<SelectItem value="other">Other</SelectItem>
											</SelectContent>
										</Select>
									)}
								/>
								<Input
									type="email"
									placeholder="john@example.com"
									{...register(`emails.${index}.value`)}
								/>
								{emailFields.length > 1 && (
									<Button
										type="button"
										variant="ghost"
										size="icon"
										onClick={() => removeEmail(index)}
									>
										<Trash2 className="h-4 w-4" />
									</Button>
								)}
							</div>
						))}
						{errors.emails && (
							<p className="text-sm text-destructive">
								{errors.emails.root?.message || "Please check email addresses"}
							</p>
						)}
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={() => appendEmail({ type: "primary", value: "" })}
						>
							<Plus className="h-4 w-4 mr-1" />
							Add Email
						</Button>
					</div>
				</div>

				{/* Communication Settings */}
				<Button
					type="button"
					variant="link"
					className="p-0 h-auto text-base font-medium underline"
					onClick={() => {
						setCommState({
							quoteFollowUp: watch("notifications.quoteFollowUp"),
							appointmentReminders: watch("notifications.appointmentReminders"),
							jobFollowUp: watch("notifications.jobFollowUp"),
							invoiceFollowUp: watch("notifications.invoiceFollowUp"),
						});
						setCommDialogOpen(true);
					}}
				>
					Communication Settings
				</Button>

				<Dialog open={commDialogOpen} onOpenChange={setCommDialogOpen}>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Communication Settings</DialogTitle>
						</DialogHeader>
						<div className="space-y-6 py-2">
							<p className="text-sm text-muted-foreground">
								Automated communications send emails and SMS to the client for key updates. They can be toggled on or off per client.
							</p>

							<div className="space-y-3">
								<div className="flex items-center justify-between">
									<h4 className="text-sm font-semibold">Quotes &amp; Invoices</h4>
									<span className="text-xs text-muted-foreground">Configure</span>
								</div>
								<div className="flex items-center justify-between">
									<Label className="font-normal">Outstanding quote follow-ups</Label>
									<Switch
										checked={commState.quoteFollowUp}
										onCheckedChange={(v) => setCommState((s) => ({ ...s, quoteFollowUp: v }))}
									/>
								</div>
								<div className="flex items-center justify-between">
									<Label className="font-normal">Overdue invoice follow-ups</Label>
									<Switch
										checked={commState.invoiceFollowUp}
										onCheckedChange={(v) => setCommState((s) => ({ ...s, invoiceFollowUp: v }))}
									/>
								</div>
							</div>

							<div className="space-y-3">
								<div className="flex items-center justify-between">
									<h4 className="text-sm font-semibold">Jobs &amp; Visits</h4>
									<span className="text-xs text-muted-foreground">Configure</span>
								</div>
								<div className="flex items-center justify-between">
									<Label className="font-normal">Upcoming assessment or visit reminders</Label>
									<Switch
										checked={commState.appointmentReminders}
										onCheckedChange={(v) => setCommState((s) => ({ ...s, appointmentReminders: v }))}
									/>
								</div>
								<div className="flex items-center justify-between">
									<Label className="font-normal">Job closure follow-ups</Label>
									<Switch
										checked={commState.jobFollowUp}
										onCheckedChange={(v) => setCommState((s) => ({ ...s, jobFollowUp: v }))}
									/>
								</div>
							</div>
						</div>
						<DialogFooter>
							<Button
								type="button"
								onClick={() => {
									setValue("notifications.quoteFollowUp", commState.quoteFollowUp);
									setValue("notifications.appointmentReminders", commState.appointmentReminders);
									setValue("notifications.jobFollowUp", commState.jobFollowUp);
									setValue("notifications.invoiceFollowUp", commState.invoiceFollowUp);
									setCommDialogOpen(false);
								}}
							>
								Save
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>

				{/* Lead Information */}
				<div className="space-y-4">
					<h3 className="text-lg font-medium">Lead Information</h3>
					<div className="space-y-2">
						<Label>Lead Source</Label>
						<Controller
							control={control}
							name="leadSource"
							render={({ field }) => (
								<Select onValueChange={field.onChange} value={field.value}>
									<SelectTrigger className="w-full">
										<SelectValue placeholder="Select a source" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="facebook">Facebook</SelectItem>
										<SelectItem value="existing_client">Existing Client</SelectItem>
										<SelectItem value="flyer">Flyer</SelectItem>
										<SelectItem value="google">Google</SelectItem>
										<SelectItem value="instagram">Instagram</SelectItem>
										<SelectItem value="referral">Referral</SelectItem>
										<SelectItem value="other">Other</SelectItem>
									</SelectContent>
								</Select>
							)}
						/>
					</div>
				</div>

				{/* Additional Client Details */}
				<div className="rounded-lg border p-4 space-y-4">
					<div>
						<h3 className="text-lg font-medium">Additional client details</h3>
						<p className="text-sm text-muted-foreground">
							Create custom fields to track additional details
						</p>
					</div>
					{customFields.length > 0 && (
						<div className="space-y-3">
							{customFields.map((cf) => (
								<div key={cf.id} className="space-y-1">
									<Label>{cf.name}</Label>
									{cf.fieldType === "checkbox" ? (
										<div className="flex items-center gap-2">
											<Checkbox defaultChecked={cf.defaultValue === "true"} />
											<span className="text-sm text-muted-foreground">{cf.name}</span>
										</div>
									) : (
										<Input
											type={cf.fieldType === "number" ? "number" : cf.fieldType === "date" ? "date" : "text"}
											placeholder={cf.defaultValue ?? ""}
											defaultValue={cf.defaultValue ?? ""}
										/>
									)}
								</div>
							))}
						</div>
					)}
					<Button
						type="button"
						variant="outline"
						size="sm"
						onClick={() => setCustomFieldDialogOpen(true)}
					>
						<Plus className="h-4 w-4 mr-1" />
						Add Custom Field
					</Button>
				</div>

				<Dialog open={customFieldDialogOpen} onOpenChange={setCustomFieldDialogOpen}>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>New custom field</DialogTitle>
						</DialogHeader>
						<div className="space-y-4 py-2">
							<div className="space-y-1">
								<Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
									Applies to
								</Label>
								<p className="text-sm font-medium">All clients</p>
							</div>
							<p className="text-sm text-muted-foreground">
								Transferable fields appear in multiple places and follow your workflow
							</p>
							<div className="space-y-2">
								<Label>Custom field name</Label>
								<Input
									placeholder="Serial Number"
									value={customFieldName}
									onChange={(e) => setCustomFieldName(e.target.value)}
								/>
							</div>
							<div className="space-y-2">
								<Label>Field type</Label>
								<Select value={customFieldType} onValueChange={setCustomFieldType}>
									<SelectTrigger className="w-full">
										<SelectValue placeholder="Select field type" />
									</SelectTrigger>
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
								<Input
									placeholder="54A17-HEX"
									value={customFieldDefault}
									onChange={(e) => setCustomFieldDefault(e.target.value)}
								/>
							</div>
							<p className="text-xs text-muted-foreground">
								All custom fields can be edited and reordered in Settings &gt; Custom Fields
							</p>
						</div>
						<DialogFooter>
							<Button
								type="button"
								variant="outline"
								onClick={() => setCustomFieldDialogOpen(false)}
							>
								Cancel
							</Button>
							<Button
								type="button"
								disabled={!customFieldName || !customFieldType || createFieldMutation.isPending}
								onClick={handleAddCustomField}
							>
								{createFieldMutation.isPending ? "Adding..." : "Add Custom Field"}
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>

				{/* Property Details */}
				<div className="space-y-4">
					<h3 className="text-lg font-medium">Property Details</h3>
					<div className="space-y-2">
						<Label htmlFor="propertyStreet1">Street 1</Label>
						<Input id="propertyStreet1" placeholder="123 Main St" {...register("propertyAddress.street1")} />
					</div>
					<div className="space-y-2">
						<Label htmlFor="propertyStreet2">Street 2</Label>
						<Input id="propertyStreet2" placeholder="Apt 4B" {...register("propertyAddress.street2")} />
					</div>
					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="propertyCity">City</Label>
							<Input id="propertyCity" placeholder="New York" {...register("propertyAddress.city")} />
						</div>
						<div className="space-y-2">
							<Label htmlFor="propertyState">State</Label>
							<Input id="propertyState" placeholder="NY" {...register("propertyAddress.state")} />
						</div>
					</div>
					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="propertyZip">Zip Code</Label>
							<Input id="propertyZip" placeholder="10001" {...register("propertyAddress.zip")} />
						</div>
						<div className="space-y-2">
							<Label htmlFor="propertyCountry">Country</Label>
							<Input id="propertyCountry" placeholder="United States" {...register("propertyAddress.country")} />
						</div>
					</div>
				</div>

				{/* Billing Address */}
				<div className="space-y-4">
					<h3 className="text-lg font-medium">Billing Address</h3>
					<Controller
						control={control}
						name="billingSameAsProperty"
						render={({ field }) => (
							<div className="flex items-center gap-2">
								<Checkbox
									id="billingSameAsProperty"
									checked={field.value}
									onCheckedChange={field.onChange}
								/>
								<Label htmlFor="billingSameAsProperty" className="font-normal">
									Billing address is the same as property address
								</Label>
							</div>
						)}
					/>
					{!billingSameAsProperty && (
						<div className="space-y-4">
							<div className="space-y-2">
								<Label htmlFor="billingStreet1">Street 1</Label>
								<Input id="billingStreet1" placeholder="123 Main St" {...register("billingAddress.street1")} />
							</div>
							<div className="space-y-2">
								<Label htmlFor="billingStreet2">Street 2</Label>
								<Input id="billingStreet2" placeholder="Apt 4B" {...register("billingAddress.street2")} />
							</div>
							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label htmlFor="billingCity">City</Label>
									<Input id="billingCity" placeholder="New York" {...register("billingAddress.city")} />
								</div>
								<div className="space-y-2">
									<Label htmlFor="billingState">State</Label>
									<Input id="billingState" placeholder="NY" {...register("billingAddress.state")} />
								</div>
							</div>
							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label htmlFor="billingZip">Zip Code</Label>
									<Input id="billingZip" placeholder="10001" {...register("billingAddress.zip")} />
								</div>
								<div className="space-y-2">
									<Label htmlFor="billingCountry">Country</Label>
									<Input id="billingCountry" placeholder="United States" {...register("billingAddress.country")} />
								</div>
							</div>
						</div>
					)}
				</div>

				{mutation.isError && (
					<p className="text-sm text-destructive">{mutation.error.message}</p>
				)}
				<div className="flex gap-2 pt-2">
					<Button type="submit" disabled={mutation.isPending}>
						{mutation.isPending ? "Creating..." : "Create Client"}
					</Button>
					<Button type="button" variant="outline" onClick={() => navigate("/clients")}>
						Cancel
					</Button>
				</div>
			</form>
		</div>
	);
};

export default CreateClientPage;
