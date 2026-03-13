import { useState, useEffect } from "react";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { createClientSchema, type CreateClientForm } from "@repo/zod/client";
import { getCustomFieldDefinitions } from "@/pages/settings/api";
import { CustomFieldDialog } from "@/components/custom-field-dialog";
import { PersonNameFields } from "@/components/common/person-name-fields";
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

type ContactEntry = {
	title: "none" | "Mr." | "Ms." | "Mrs." | "Miss." | "Dr.";
	firstName: string;
	lastName: string;
	role: string;
	phone: string;
	email: string;
	notifications: {
		quoteFollowUp: boolean;
		invoiceFollowUp: boolean;
		appointmentReminders: boolean;
		jobFollowUp: boolean;
	};
};

const defaultContact: ContactEntry = {
	title: "none",
	firstName: "",
	lastName: "",
	role: "",
	phone: "",
	email: "",
	notifications: {
		quoteFollowUp: true,
		invoiceFollowUp: true,
		appointmentReminders: true,
		jobFollowUp: true,
	},
};

function FormSection({ title, description, action, children }: { title: string; description?: string; action?: React.ReactNode; children: React.ReactNode }) {
	return (
		<div className="grid md:grid-cols-[280px_1fr] gap-x-8 gap-y-4">
			<div className="space-y-3 md:sticky md:top-18 self-start">
				<div className="space-y-1">
					<h3 className="text-lg font-medium">{title}</h3>
					{description && <p className="text-sm text-muted-foreground">{description}</p>}
				</div>
				{action}
			</div>
			<div className="space-y-4">{children}</div>
		</div>
	);
}

interface ClientFormProps {
	defaultValues?: Partial<CreateClientForm>;
	initialContacts?: { additional: ContactEntry[]; property: ContactEntry[] };
	onSubmit: (data: CreateClientForm) => void;
	onReset?: (resetFn: () => void) => void;
	error?: string | null;
}

export default function ClientForm({ defaultValues, initialContacts, onSubmit: onSubmitProp, onReset, error }: ClientFormProps) {
	const [additionalContacts, setAdditionalContacts] = useState<ContactEntry[]>(initialContacts?.additional ?? []);
	const [propertyContacts, setPropertyContacts] = useState<ContactEntry[]>(initialContacts?.property ?? []);
	const [contactDialogOpen, setContactDialogOpen] = useState(false);
	const [contactTarget, setContactTarget] = useState<"additional" | "property">("additional");
	const [contactForm, setContactForm] = useState<ContactEntry>({ ...defaultContact });

	const resetContactForm = () => setContactForm({ ...defaultContact });

	const { data: customFields = [] } = useQuery({
		queryKey: ["custom-field-definitions", "client"],
		queryFn: () => getCustomFieldDefinitions("client"),
	});

	const { data: propertyCustomFields = [] } = useQuery({
		queryKey: ["custom-field-definitions", "property"],
		queryFn: () => getCustomFieldDefinitions("property"),
	});

	const {
		register,
		handleSubmit,
		control,
		watch,
		setValue,
		reset,
		formState: { errors },
	} = useForm<CreateClientForm>({
		resolver: zodResolver(createClientSchema),
		defaultValues: {
			title: "none",
			useCompanyAsPrimary: false,
			phones: [{ type: "mobile", number: "" }],
			emails: [{ type: "primary", value: "" }],
			notifications: {
				quoteFollowUp: true,
				appointmentReminders: true,
				jobFollowUp: true,
				invoiceFollowUp: true,
			},
			properties: [
				{
					address: {},
					billingSameAsProperty: true,
				},
			],
			...defaultValues,
		},
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

	const {
		fields: propertyFields,
		append: appendProperty,
		remove: removeProperty,
	} = useFieldArray({ control, name: "properties" });

	useEffect(() => {
		if (onReset) {
			onReset(() => {
				reset();
				setAdditionalContacts([]);
				setPropertyContacts([]);
			});
		}
	}, [onReset, reset]);

	const [customFieldDialogOpen, setCustomFieldDialogOpen] = useState(false);
	const [customFieldTarget, setCustomFieldTarget] = useState<"client" | "property">("client");

	const [commDialogOpen, setCommDialogOpen] = useState(false);
	const [commState, setCommState] = useState({
		quoteFollowUp: true,
		appointmentReminders: true,
		jobFollowUp: true,
		invoiceFollowUp: true,
	});

	const onSubmit = (data: CreateClientForm) => {
		const allContacts = [...additionalContacts, ...propertyContacts];
		onSubmitProp({
			...data,
			additionalContacts: allContacts.length > 0 ? allContacts : undefined,
		});
	};

	return (
		<>
			<form id="client-form" onSubmit={handleSubmit(onSubmit)} className="space-y-10">
				{/* Primary Contact Details - Two Column */}
				<FormSection
					title="Primary contact details"
					description="Provide the main point of contact to ensure smooth communication and reliable client records."
				>
					<PersonNameFields
						title={watch("title")}
						onTitleChange={(v) => setValue("title", v)}
						firstNameProps={register("firstName")}
						lastNameProps={register("lastName")}
						errors={{
							firstName: errors.firstName?.message,
							lastName: errors.lastName?.message,
						}}
					/>
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

					{/* Contact Details */}
					<div className="space-y-4 pt-4">
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
												<SelectTrigger className="w-35">
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

						{/* Communication Settings */}
						<Button
							type="button"
							variant="link"
							className="p-0 h-auto text-sm font-medium underline"
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
					</div>

					{/* Lead Information */}
					<div className="space-y-4 pt-4">
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
							onClick={() => {
								setCustomFieldTarget("client");
								setCustomFieldDialogOpen(true);
							}}
						>
							<Plus className="h-4 w-4 mr-1" />
							Add Custom Field
						</Button>
					</div>

					{/* Additional Contacts */}
					<div className="rounded-lg border p-4 space-y-4">
						<div>
							<h3 className="text-lg font-medium">Additional contacts</h3>
							<p className="text-sm text-muted-foreground">
								For contacts with access to all properties, e.g., spouse or family for residential, or property or regional managers for commercial.
							</p>
						</div>
						{additionalContacts.length > 0 && (
							<div className="space-y-2">
								{additionalContacts.map((contact, index) => (
									<div key={index} className="flex items-center justify-between rounded-md border px-3 py-2">
										<div>
											<p className="text-sm font-medium">
												{contact.title !== "none" ? `${contact.title} ` : ""}{contact.firstName} {contact.lastName}
											</p>
											{contact.role && <p className="text-xs text-muted-foreground">{contact.role}</p>}
										</div>
										<Button
											type="button"
											variant="ghost"
											size="icon"
											onClick={() => setAdditionalContacts((prev) => prev.filter((_, i) => i !== index))}
										>
											<Trash2 className="h-4 w-4" />
										</Button>
									</div>
								))}
							</div>
						)}
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={() => {
								resetContactForm();
								setContactTarget("additional");
								setContactDialogOpen(true);
							}}
						>
							<Plus className="h-4 w-4 mr-1" />
							Add Contact
						</Button>
					</div>
				</FormSection>

				<hr />

				{/* Properties */}
				{propertyFields.map((field, propIndex) => (
					<div key={field.id} className="space-y-10">
						<FormSection
							title={propertyFields.length > 1 ? `Property ${propIndex + 1} Address` : "Property Address"}
							description="Enter the primary service address, billing address, or any additional locations where services may take place."
							action={
								<Button
									type="button"
									variant="outline"
									size="sm"
									onClick={() => appendProperty({
										address: {},
										billingSameAsProperty: true,
									})}
								>
									<Plus className="h-4 w-4 mr-1" />
									Add Another Property
								</Button>
							}
						>
							{propIndex > 0 && (
								<div className="flex justify-end -mt-2">
									<Button
										type="button"
										variant="ghost"
										size="sm"
										onClick={() => removeProperty(propIndex)}
									>
										<Trash2 className="h-4 w-4 mr-1" />
										Remove Property
									</Button>
								</div>
							)}
							<div className="space-y-2">
								<Label>Street 1</Label>
								<Input placeholder="123 Main St" {...register(`properties.${propIndex}.address.street1`)} />
							</div>
							<div className="space-y-2">
								<Label>Street 2</Label>
								<Input placeholder="Apt 4B" {...register(`properties.${propIndex}.address.street2`)} />
							</div>
							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label>City</Label>
									<Input placeholder="New York" {...register(`properties.${propIndex}.address.city`)} />
								</div>
								<div className="space-y-2">
									<Label>State</Label>
									<Input placeholder="NY" {...register(`properties.${propIndex}.address.state`)} />
								</div>
							</div>
							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label>Zip Code</Label>
									<Input placeholder="10001" {...register(`properties.${propIndex}.address.zip`)} />
								</div>
								<div className="space-y-2">
									<Label>Country</Label>
									<Input placeholder="United States" {...register(`properties.${propIndex}.address.country`)} />
								</div>
							</div>

							{/* Billing Address */}
							<div className="space-y-4 pt-4">
								<h3 className="text-lg font-medium">Billing Address</h3>
								<Controller
									control={control}
									name={`properties.${propIndex}.billingSameAsProperty`}
									render={({ field }) => (
										<div className="flex items-center gap-2">
											<Checkbox
												checked={field.value}
												onCheckedChange={field.onChange}
											/>
											<Label className="font-normal">
												Billing address is the same as property address
											</Label>
										</div>
									)}
								/>
								{!watch(`properties.${propIndex}.billingSameAsProperty`) && (
									<div className="space-y-4">
										<div className="space-y-2">
											<Label>Street 1</Label>
											<Input placeholder="123 Main St" {...register(`properties.${propIndex}.billingAddress.street1`)} />
										</div>
										<div className="space-y-2">
											<Label>Street 2</Label>
											<Input placeholder="Apt 4B" {...register(`properties.${propIndex}.billingAddress.street2`)} />
										</div>
										<div className="grid grid-cols-2 gap-4">
											<div className="space-y-2">
												<Label>City</Label>
												<Input placeholder="New York" {...register(`properties.${propIndex}.billingAddress.city`)} />
											</div>
											<div className="space-y-2">
												<Label>State</Label>
												<Input placeholder="NY" {...register(`properties.${propIndex}.billingAddress.state`)} />
											</div>
										</div>
										<div className="grid grid-cols-2 gap-4">
											<div className="space-y-2">
												<Label>Zip Code</Label>
												<Input placeholder="10001" {...register(`properties.${propIndex}.billingAddress.zip`)} />
											</div>
											<div className="space-y-2">
												<Label>Country</Label>
												<Input placeholder="United States" {...register(`properties.${propIndex}.billingAddress.country`)} />
											</div>
										</div>
									</div>
								)}
							</div>

							{/* Property Custom Fields */}
							<div className="rounded-lg border p-4 space-y-4">
								<div>
									<h3 className="text-lg font-medium">Property details</h3>
									<p className="text-sm text-muted-foreground">
										Create custom fields to track additional details
									</p>
								</div>
								{propertyCustomFields.length > 0 && (
									<div className="space-y-3">
										{propertyCustomFields.map((cf) => (
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
									onClick={() => {
										setCustomFieldTarget("property");
										setCustomFieldDialogOpen(true);
									}}
								>
									<Plus className="h-4 w-4 mr-1" />
									Add Custom Field
								</Button>
							</div>

							{/* Property Contacts */}
							<div className="rounded-lg border p-4 space-y-4">
								<div>
									<h3 className="text-lg font-medium">Property contacts</h3>
									<p className="text-sm text-muted-foreground">
										For contacts with access limited to this property
									</p>
								</div>
								{propertyContacts.length > 0 && (
									<div className="space-y-2">
										{propertyContacts.map((contact, index) => (
											<div key={index} className="flex items-center justify-between rounded-md border px-3 py-2">
												<div>
													<p className="text-sm font-medium">
														{contact.title !== "none" ? `${contact.title} ` : ""}{contact.firstName} {contact.lastName}
													</p>
													{contact.role && <p className="text-xs text-muted-foreground">{contact.role}</p>}
												</div>
												<Button
													type="button"
													variant="ghost"
													size="icon"
													onClick={() => setPropertyContacts((prev) => prev.filter((_, i) => i !== index))}
												>
													<Trash2 className="h-4 w-4" />
												</Button>
											</div>
										))}
									</div>
								)}
								<Button
									type="button"
									variant="outline"
									size="sm"
									onClick={() => {
										resetContactForm();
										setContactTarget("property");
										setContactDialogOpen(true);
									}}
								>
									<Plus className="h-4 w-4 mr-1" />
									Add Contact
								</Button>
							</div>
						</FormSection>

						{propIndex < propertyFields.length - 1 && <hr />}
					</div>
				))}

				{error && (
					<p className="text-sm text-destructive">{error}</p>
				)}
			</form>

			{/* Communication Settings Dialog */}
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
								<Switch checked={commState.quoteFollowUp} onCheckedChange={(v) => setCommState((s) => ({ ...s, quoteFollowUp: v }))} />
							</div>
							<div className="flex items-center justify-between">
								<Label className="font-normal">Overdue invoice follow-ups</Label>
								<Switch checked={commState.invoiceFollowUp} onCheckedChange={(v) => setCommState((s) => ({ ...s, invoiceFollowUp: v }))} />
							</div>
						</div>
						<div className="space-y-3">
							<div className="flex items-center justify-between">
								<h4 className="text-sm font-semibold">Jobs &amp; Visits</h4>
								<span className="text-xs text-muted-foreground">Configure</span>
							</div>
							<div className="flex items-center justify-between">
								<Label className="font-normal">Upcoming assessment or visit reminders</Label>
								<Switch checked={commState.appointmentReminders} onCheckedChange={(v) => setCommState((s) => ({ ...s, appointmentReminders: v }))} />
							</div>
							<div className="flex items-center justify-between">
								<Label className="font-normal">Job closure follow-ups</Label>
								<Switch checked={commState.jobFollowUp} onCheckedChange={(v) => setCommState((s) => ({ ...s, jobFollowUp: v }))} />
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

			{/* Custom Field Dialog */}
			<CustomFieldDialog
				open={customFieldDialogOpen}
				onOpenChange={setCustomFieldDialogOpen}
				appliesTo={customFieldTarget}
			/>

			{/* Contact Dialog */}
			<Dialog open={contactDialogOpen} onOpenChange={setContactDialogOpen}>
				<DialogContent className="max-h-[85vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>Add contact</DialogTitle>
					</DialogHeader>
					<div className="space-y-6 py-2">
						<div className="space-y-4">
							<h4 className="text-sm font-semibold">Details</h4>
							<PersonNameFields
								title={contactForm.title}
								onTitleChange={(v) => setContactForm((s) => ({ ...s, title: v }))}
								firstNameProps={{
									value: contactForm.firstName,
									onChange: (e) => setContactForm((s) => ({ ...s, firstName: e.target.value })),
								}}
								lastNameProps={{
									value: contactForm.lastName,
									onChange: (e) => setContactForm((s) => ({ ...s, lastName: e.target.value })),
								}}
							/>
							<div className="space-y-2">
								<Label>Role</Label>
								<Input placeholder="e.g., Spouse, Property Manager" value={contactForm.role} onChange={(e) => setContactForm((s) => ({ ...s, role: e.target.value }))} />
							</div>
						</div>
						<div className="space-y-4">
							<h4 className="text-sm font-semibold">Communication</h4>
							<div className="space-y-2">
								<Label>Phone number</Label>
								<Input placeholder="(555) 123-4567" value={contactForm.phone} onChange={(e) => setContactForm((s) => ({ ...s, phone: e.target.value }))} />
							</div>
							<div className="space-y-2">
								<Label>Email</Label>
								<Input type="email" placeholder="contact@example.com" value={contactForm.email} onChange={(e) => setContactForm((s) => ({ ...s, email: e.target.value }))} />
							</div>
						</div>
						<div className="space-y-4">
							<h4 className="text-sm font-semibold">Communication settings</h4>
							<div className="space-y-3">
								<div className="flex items-center justify-between">
									<span className="text-sm font-medium">Quotes &amp; Invoices</span>
									<span className="text-xs text-muted-foreground">Configure</span>
								</div>
								<div className="flex items-center justify-between">
									<Label className="font-normal">Outstanding quote follow-ups</Label>
									<Switch checked={contactForm.notifications.quoteFollowUp} onCheckedChange={(v) => setContactForm((s) => ({ ...s, notifications: { ...s.notifications, quoteFollowUp: v } }))} />
								</div>
								<div className="flex items-center justify-between">
									<Label className="font-normal">Overdue invoice follow-ups</Label>
									<Switch checked={contactForm.notifications.invoiceFollowUp} onCheckedChange={(v) => setContactForm((s) => ({ ...s, notifications: { ...s.notifications, invoiceFollowUp: v } }))} />
								</div>
							</div>
							<div className="space-y-3">
								<div className="flex items-center justify-between">
									<span className="text-sm font-medium">Jobs &amp; Visits</span>
									<span className="text-xs text-muted-foreground">Configure</span>
								</div>
								<div className="flex items-center justify-between">
									<Label className="font-normal">Upcoming assessment or visit reminders</Label>
									<Switch checked={contactForm.notifications.appointmentReminders} onCheckedChange={(v) => setContactForm((s) => ({ ...s, notifications: { ...s.notifications, appointmentReminders: v } }))} />
								</div>
								<div className="flex items-center justify-between">
									<Label className="font-normal">Job closure follow-ups</Label>
									<Switch checked={contactForm.notifications.jobFollowUp} onCheckedChange={(v) => setContactForm((s) => ({ ...s, notifications: { ...s.notifications, jobFollowUp: v } }))} />
								</div>
							</div>
						</div>
					</div>
					<DialogFooter>
						<Button type="button" variant="outline" onClick={() => setContactDialogOpen(false)}>Cancel</Button>
						<Button
							type="button"
							disabled={!contactForm.firstName || !contactForm.lastName}
							onClick={() => {
								if (contactTarget === "additional") {
									setAdditionalContacts((prev) => [...prev, contactForm]);
								} else {
									setPropertyContacts((prev) => [...prev, contactForm]);
								}
								setContactDialogOpen(false);
							}}
						>
							Add Contact
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
