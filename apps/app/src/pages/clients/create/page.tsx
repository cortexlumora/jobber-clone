import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router";
import { createClientSchema, type CreateClientForm } from "@repo/zod/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
		formState: { errors },
	} = useForm<CreateClientForm>({
		resolver: zodResolver(createClientSchema),
		defaultValues: {
			status: "lead",
		},
	});

	const onSubmit = (data: CreateClientForm) => {
		console.log(data);
		navigate("/clients");
	};

	return (
		<div className="max-w-2xl">
			<h2 className="text-2xl font-semibold mb-4">Create Client</h2>
			<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
				<div className="grid grid-cols-2 gap-4">
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
					<Label htmlFor="company">Company Name</Label>
					<Input id="company" placeholder="Acme Inc." {...register("company")} />
				</div>
				<div className="grid grid-cols-2 gap-4">
					<div className="space-y-2">
						<Label htmlFor="email">Email</Label>
						<Input id="email" type="email" placeholder="john@example.com" {...register("email")} />
						{errors.email && (
							<p className="text-sm text-destructive">{errors.email.message}</p>
						)}
					</div>
					<div className="space-y-2">
						<Label htmlFor="phone">Phone</Label>
						<Input id="phone" type="tel" placeholder="(555) 123-4567" {...register("phone")} />
					</div>
				</div>
				<div className="space-y-2">
					<Label htmlFor="address">Address</Label>
					<Input id="address" placeholder="123 Main St" {...register("address")} />
				</div>
				<div className="grid grid-cols-3 gap-4">
					<div className="space-y-2">
						<Label htmlFor="city">City</Label>
						<Input id="city" placeholder="New York" {...register("city")} />
					</div>
					<div className="space-y-2">
						<Label htmlFor="state">State</Label>
						<Input id="state" placeholder="NY" {...register("state")} />
					</div>
					<div className="space-y-2">
						<Label htmlFor="zip">Zip Code</Label>
						<Input id="zip" placeholder="10001" {...register("zip")} />
					</div>
				</div>
				<div className="space-y-2">
					<Label htmlFor="status">Status</Label>
					<Controller
						control={control}
						name="status"
						render={({ field }) => (
							<Select onValueChange={field.onChange} value={field.value}>
								<SelectTrigger>
									<SelectValue placeholder="Select status" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="lead">Lead</SelectItem>
									<SelectItem value="active">Active</SelectItem>
									<SelectItem value="inactive">Inactive</SelectItem>
								</SelectContent>
							</Select>
						)}
					/>
					{errors.status && (
						<p className="text-sm text-destructive">{errors.status.message}</p>
					)}
				</div>
				<div className="space-y-2">
					<Label htmlFor="notes">Notes</Label>
					<Textarea id="notes" placeholder="Additional notes..." {...register("notes")} />
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
