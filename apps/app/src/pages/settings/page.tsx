import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface BusinessDay {
	enabled: boolean;
	open: string;
	close: string;
}

interface SettingsFormData {
	companyName: string;
	phone: string;
	websiteUrl: string;
	email: string;
	street1: string;
	street2: string;
	city: string;
	state: string;
	zip: string;
}

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;

const DEFAULT_HOURS: Record<string, BusinessDay> = {
	Sunday: { enabled: false, open: "09:00", close: "17:00" },
	Monday: { enabled: true, open: "09:00", close: "17:00" },
	Tuesday: { enabled: true, open: "09:00", close: "17:00" },
	Wednesday: { enabled: true, open: "09:00", close: "17:00" },
	Thursday: { enabled: true, open: "09:00", close: "17:00" },
	Friday: { enabled: true, open: "09:00", close: "17:00" },
	Saturday: { enabled: false, open: "09:00", close: "17:00" },
};

const formatTime = (time: string) => {
	const [h, m] = time.split(":");
	const hour = parseInt(h);
	const ampm = hour >= 12 ? "PM" : "AM";
	const display = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
	return `${display}:${m} ${ampm}`;
};

const SettingsPage = () => {
	const [businessHours, setBusinessHours] = useState(DEFAULT_HOURS);
	const [editingHours, setEditingHours] = useState(false);
	const [showBusinessHours, setShowBusinessHours] = useState(true);

	const { register, handleSubmit } = useForm<SettingsFormData>({
		defaultValues: {
			companyName: "",
			phone: "",
			websiteUrl: "",
			email: "",
			street1: "",
			street2: "",
			city: "",
			state: "",
			zip: "",
		},
	});

	const onSubmit = (data: SettingsFormData) => {
		console.log("Settings:", data, "Hours:", businessHours);
	};

	const toggleDay = (day: string) => {
		setBusinessHours((prev) => ({
			...prev,
			[day]: { ...prev[day], enabled: !prev[day].enabled },
		}));
	};

	const updateTime = (day: string, field: "open" | "close", value: string) => {
		setBusinessHours((prev) => ({
			...prev,
			[day]: { ...prev[day], [field]: value },
		}));
	};

	return (
		<div className="max-w-2xl mx-auto">
			<h2 className="text-2xl font-semibold mt-8 mb-8">Settings</h2>
			<form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
				{/* Company Details */}
				<div className="space-y-4">
					<h3 className="text-lg font-medium">Company Details</h3>
					<div className="space-y-2">
						<Label htmlFor="companyName">Company Name</Label>
						<Input id="companyName" placeholder="Your company name" {...register("companyName")} />
					</div>
					<div className="space-y-2">
						<Label htmlFor="phone">Phone Number</Label>
						<Input id="phone" placeholder="(555) 123-4567" {...register("phone")} />
					</div>
					<div className="space-y-2">
						<Label htmlFor="websiteUrl">Website URL</Label>
						<Input id="websiteUrl" placeholder="https://yourcompany.com" {...register("websiteUrl")} />
					</div>
					<div className="space-y-2">
						<Label htmlFor="email">Email Address</Label>
						<Input id="email" type="email" placeholder="info@yourcompany.com" {...register("email")} />
					</div>
					<div className="space-y-2">
						<Label htmlFor="street1">Street 1</Label>
						<Input id="street1" placeholder="123 Main St" {...register("street1")} />
					</div>
					<div className="space-y-2">
						<Label htmlFor="street2">Street 2</Label>
						<Input id="street2" placeholder="Suite 100" {...register("street2")} />
					</div>
					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="city">City</Label>
							<Input id="city" placeholder="New York" {...register("city")} />
						</div>
						<div className="space-y-2">
							<Label htmlFor="state">State</Label>
							<Input id="state" placeholder="NY" {...register("state")} />
						</div>
					</div>
					<div className="space-y-2">
						<Label htmlFor="zip">Zip Code</Label>
						<Input id="zip" placeholder="10001" {...register("zip")} className="max-w-[200px]" />
					</div>
				</div>

				{/* Business Hours */}
				<div className="space-y-4">
					<div>
						<h3 className="text-lg font-medium">Business Hours</h3>
						<p className="text-sm text-muted-foreground">
							Business hours set your default availability for online booking, team members, and request forms.
						</p>
					</div>

					<div className="rounded-lg border divide-y">
						{DAYS.map((day) => {
							const hours = businessHours[day];
							return (
								<div key={day} className="flex items-center justify-between px-4 py-3">
									<span className="text-sm font-medium w-28">{day}</span>
									{editingHours ? (
										<div className="flex items-center gap-3">
											<Switch
												checked={hours.enabled}
												onCheckedChange={() => toggleDay(day)}
											/>
											{hours.enabled ? (
												<div className="flex items-center gap-2">
													<Input
														type="time"
														value={hours.open}
														onChange={(e) => updateTime(day, "open", e.target.value)}
														className="w-32"
													/>
													<span className="text-sm text-muted-foreground">–</span>
													<Input
														type="time"
														value={hours.close}
														onChange={(e) => updateTime(day, "close", e.target.value)}
														className="w-32"
													/>
												</div>
											) : (
												<span className="text-sm text-muted-foreground">Closed</span>
											)}
										</div>
									) : (
										<span className="text-sm text-muted-foreground">
											{hours.enabled
												? `${formatTime(hours.open)} – ${formatTime(hours.close)}`
												: "Closed"}
										</span>
									)}
								</div>
							);
						})}
					</div>

					<Button
						type="button"
						variant="outline"
						size="sm"
						onClick={() => setEditingHours(!editingHours)}
					>
						{editingHours ? "Done" : "Edit"}
					</Button>

					<div className="flex items-center justify-between">
						<div>
							<Label htmlFor="showBusinessHours" className="font-medium">Show business hours</Label>
							<p className="text-sm text-muted-foreground">
								Display your business hours on client hub.
							</p>
						</div>
						<Switch
							id="showBusinessHours"
							checked={showBusinessHours}
							onCheckedChange={setShowBusinessHours}
						/>
					</div>
				</div>

				<div className="flex gap-2 pt-2 pb-8">
					<Button type="submit">Save Settings</Button>
				</div>
			</form>
		</div>
	);
};

export default SettingsPage;
