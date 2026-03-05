import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
	return (
		<div className="max-w-2xl">
			<h2 className="text-2xl font-semibold mb-4">Create Client</h2>
			<Card>
				<CardHeader>
					<CardTitle>Client Details</CardTitle>
				</CardHeader>
				<CardContent>
					<form className="space-y-4">
						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="firstName">First Name</Label>
								<Input id="firstName" placeholder="John" />
							</div>
							<div className="space-y-2">
								<Label htmlFor="lastName">Last Name</Label>
								<Input id="lastName" placeholder="Smith" />
							</div>
						</div>
						<div className="space-y-2">
							<Label htmlFor="company">Company Name</Label>
							<Input id="company" placeholder="Acme Inc." />
						</div>
						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="email">Email</Label>
								<Input id="email" type="email" placeholder="john@example.com" />
							</div>
							<div className="space-y-2">
								<Label htmlFor="phone">Phone</Label>
								<Input id="phone" type="tel" placeholder="(555) 123-4567" />
							</div>
						</div>
						<div className="space-y-2">
							<Label htmlFor="address">Address</Label>
							<Input id="address" placeholder="123 Main St" />
						</div>
						<div className="grid grid-cols-3 gap-4">
							<div className="space-y-2">
								<Label htmlFor="city">City</Label>
								<Input id="city" placeholder="New York" />
							</div>
							<div className="space-y-2">
								<Label htmlFor="state">State</Label>
								<Input id="state" placeholder="NY" />
							</div>
							<div className="space-y-2">
								<Label htmlFor="zip">Zip Code</Label>
								<Input id="zip" placeholder="10001" />
							</div>
						</div>
						<div className="space-y-2">
							<Label htmlFor="status">Status</Label>
							<Select>
								<SelectTrigger>
									<SelectValue placeholder="Select status" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="lead">Lead</SelectItem>
									<SelectItem value="active">Active</SelectItem>
									<SelectItem value="inactive">Inactive</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-2">
							<Label htmlFor="notes">Notes</Label>
							<Textarea id="notes" placeholder="Additional notes..." />
						</div>
						<div className="flex gap-2 pt-2">
							<Button type="submit">Create Client</Button>
							<Button type="button" variant="outline">Cancel</Button>
						</div>
					</form>
				</CardContent>
			</Card>
		</div>
	);
};

export default CreateClientPage;
