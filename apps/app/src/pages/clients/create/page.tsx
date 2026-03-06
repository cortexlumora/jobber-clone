import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router";
import { createClientSchema, type CreateClientForm } from "@repo/zod/client";
import { Plus, Trash2 } from "lucide-react";
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

const CreateClientPage = () => {
	const navigate = useNavigate();
	const {
		register,
		handleSubmit,
		control,
		watch,
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
		},
	});

	const billingSameAsProperty = watch("billingSameAsProperty");

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
		console.log(data);
		navigate("/clients");
	};

	return (
		<div className="max-w-2xl">
			<h2 className="text-2xl font-semibold mb-6">Create Client</h2>
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

				<div className="flex gap-2 pt-2">
					<Button type="submit">Create Client</Button>
					<Button type="button" variant="outline" onClick={() => navigate("/clients")}>
						Cancel
					</Button>
				</div>
			</form>
		</div>
	);
};

export default CreateClientPage;
