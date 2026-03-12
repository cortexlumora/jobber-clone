import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCompanySettings, updateCompanySettings } from "../api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

interface BusinessDay {
	enabled: boolean;
	open: string;
	close: string;
}

interface FormData {
	companyName: string;
	phone: string;
	websiteUrl: string;
	email: string;
	street1: string;
	street2: string;
	city: string;
	state: string;
	zip: string;
	taxIdName: string;
	taxIdNumber: string;
	country: string;
	timezone: string;
	dateFormat: string;
	timeFormat: string;
	firstDayOfWeek: string;
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

const CompanySettingsPage = () => {
	const queryClient = useQueryClient();
	const [businessHours, setBusinessHours] = useState(DEFAULT_HOURS);
	const [editingHours, setEditingHours] = useState(false);
	const [showBusinessHours, setShowBusinessHours] = useState(true);

	const { data: settings } = useQuery({
		queryKey: ["company-settings"],
		queryFn: getCompanySettings,
	});

	const mutation = useMutation({
		mutationFn: updateCompanySettings,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["company-settings"] });
		},
	});

	const { register, handleSubmit, control, reset } = useForm<FormData>({
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
			taxIdName: "",
			taxIdNumber: "",
			country: "",
			timezone: "",
			dateFormat: "MM/DD/YYYY",
			timeFormat: "12h",
			firstDayOfWeek: "sunday",
		},
	});

	useEffect(() => {
		if (settings) {
			reset({
				companyName: settings.companyName ?? "",
				phone: settings.phone ?? "",
				websiteUrl: settings.websiteUrl ?? "",
				email: settings.email ?? "",
				street1: settings.street1 ?? "",
				street2: settings.street2 ?? "",
				city: settings.city ?? "",
				state: settings.state ?? "",
				zip: settings.zip ?? "",
				taxIdName: settings.taxIdName ?? "",
				taxIdNumber: settings.taxIdNumber ?? "",
				country: settings.country ?? "",
				timezone: settings.timezone ?? "",
				dateFormat: settings.dateFormat,
				timeFormat: settings.timeFormat,
				firstDayOfWeek: settings.firstDayOfWeek,
			});
			if (settings.businessHours) {
				setBusinessHours(settings.businessHours);
			}
			setShowBusinessHours(settings.showBusinessHours);
		}
	}, [settings, reset]);

	const onSubmit = (data: FormData) => {
		mutation.mutate({
			...data,
			businessHours,
			showBusinessHours,
		});
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
		<div className="max-w-2xl">
			<h2 className="text-2xl font-semibold mb-8">Company Settings</h2>
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

				{/* Tax Settings */}
				<div className="space-y-4">
					<h3 className="text-lg font-medium">Tax Settings</h3>
					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="taxIdName">Tax ID Name (e.g. GST)</Label>
							<Input id="taxIdName" placeholder="GST" {...register("taxIdName")} />
						</div>
						<div className="space-y-2">
							<Label htmlFor="taxIdNumber">Tax ID Number</Label>
							<Input id="taxIdNumber" placeholder="123456789" {...register("taxIdNumber")} />
						</div>
					</div>
					<p className="text-xs text-muted-foreground">
						Tax ID name and number will appear on invoices.
					</p>

					<div className="rounded-lg border p-4">
						<p className="text-sm text-muted-foreground mb-3">
							No tax rates. Create one or more tax rates to apply them to quotes and invoices.
						</p>
						<div className="flex gap-2">
							<Button type="button" variant="outline" size="sm">Create Tax Rate</Button>
							<Button type="button" variant="outline" size="sm">Create Tax Group</Button>
						</div>
					</div>
				</div>

				{/* Regional Settings */}
				<div className="space-y-4">
					<h3 className="text-lg font-medium">Regional Settings</h3>
					<div className="space-y-2">
						<Label>Country</Label>
						<Controller
							control={control}
							name="country"
							render={({ field }) => (
								<Select onValueChange={field.onChange} value={field.value}>
									<SelectTrigger className="w-full">
										<SelectValue placeholder="Select country" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="US">United States</SelectItem>
										<SelectItem value="CA">Canada</SelectItem>
										<SelectItem value="GB">United Kingdom</SelectItem>
										<SelectItem value="AU">Australia</SelectItem>
										<SelectItem value="IN">India</SelectItem>
										<SelectItem value="DE">Germany</SelectItem>
										<SelectItem value="FR">France</SelectItem>
									</SelectContent>
								</Select>
							)}
						/>
					</div>
					<div className="space-y-2">
						<Label>Timezone</Label>
						<Controller
							control={control}
							name="timezone"
							render={({ field }) => (
								<Select onValueChange={field.onChange} value={field.value}>
									<SelectTrigger className="w-full">
										<SelectValue placeholder="Select timezone" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
										<SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
										<SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
										<SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
										<SelectItem value="America/Toronto">Toronto (ET)</SelectItem>
										<SelectItem value="Europe/London">London (GMT)</SelectItem>
										<SelectItem value="Europe/Berlin">Berlin (CET)</SelectItem>
										<SelectItem value="Asia/Kolkata">India (IST)</SelectItem>
										<SelectItem value="Australia/Sydney">Sydney (AEST)</SelectItem>
									</SelectContent>
								</Select>
							)}
						/>
					</div>
					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label>Date Format</Label>
							<Controller
								control={control}
								name="dateFormat"
								render={({ field }) => (
									<Select onValueChange={field.onChange} value={field.value}>
										<SelectTrigger className="w-full">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
											<SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
											<SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
										</SelectContent>
									</Select>
								)}
							/>
						</div>
						<div className="space-y-2">
							<Label>Time Format</Label>
							<Controller
								control={control}
								name="timeFormat"
								render={({ field }) => (
									<Select onValueChange={field.onChange} value={field.value}>
										<SelectTrigger className="w-full">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="12h">12-hour (1:00 PM)</SelectItem>
											<SelectItem value="24h">24-hour (13:00)</SelectItem>
										</SelectContent>
									</Select>
								)}
							/>
						</div>
					</div>
					<div className="space-y-2">
						<Label>First Day of the Week</Label>
						<Controller
							control={control}
							name="firstDayOfWeek"
							render={({ field }) => (
								<Select onValueChange={field.onChange} value={field.value}>
									<SelectTrigger className="w-full">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="sunday">Sunday</SelectItem>
										<SelectItem value="monday">Monday</SelectItem>
										<SelectItem value="saturday">Saturday</SelectItem>
									</SelectContent>
								</Select>
							)}
						/>
					</div>
				</div>

				{mutation.isError && (
					<p className="text-sm text-destructive">{mutation.error.message}</p>
				)}
				<div className="flex gap-2 pt-2 pb-8">
					<Button type="submit" disabled={mutation.isPending}>
						{mutation.isPending ? "Saving..." : "Save Settings"}
					</Button>
				</div>
			</form>
		</div>
	);
};

export default CompanySettingsPage;
