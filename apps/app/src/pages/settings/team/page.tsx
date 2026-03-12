import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type PermissionPreset = "worker_limited" | "worker" | "dispatcher" | "manager" | "custom";

const presets: { value: PermissionPreset; label: string; description: string }[] = [
	{ value: "worker_limited", label: "Worker (Limited access)", description: "View their schedule, mark work complete, and track their time." },
	{ value: "worker", label: "Worker", description: "View all clients, quotes, and jobs, including pricing details." },
	{ value: "dispatcher", label: "Dispatcher", description: "Edit job, team and client details. Recommended for team leads." },
	{ value: "manager", label: "Manager", description: "Manage all areas including billing — excludes reports and payroll. Recommended for management." },
	{ value: "custom", label: "Custom", description: "" },
];

type PermissionLevel = string;

interface Permissions {
	schedule: PermissionLevel;
	timeTracking: PermissionLevel;
	notes: PermissionLevel;
	expenses: PermissionLevel;
	showPricing: boolean;
	jobCosting: boolean;
	clientsProperties: PermissionLevel;
	requests: PermissionLevel;
	quotes: PermissionLevel;
	jobs: PermissionLevel;
	invoices: PermissionLevel;
	payments: boolean;
	reports: boolean;
}

const defaultPermissions: Permissions = {
	schedule: "view_own",
	timeTracking: "view_own",
	notes: "view_jobs_visits",
	expenses: "view_own",
	showPricing: false,
	jobCosting: false,
	clientsProperties: "view_name_address",
	requests: "view",
	quotes: "view",
	jobs: "view",
	invoices: "view",
	payments: false,
	reports: false,
};

function PermissionRadioGroup({
	label,
	description,
	value,
	onChange,
	options,
}: {
	label: string;
	description?: string;
	value: string;
	onChange: (v: string) => void;
	options: { value: string; label: string }[];
}) {
	return (
		<div className="space-y-3">
			<div>
				<h4 className="text-sm font-semibold">{label}</h4>
				{description && <p className="text-xs text-muted-foreground">{description}</p>}
			</div>
			<div className="space-y-2">
				{options.map((opt) => (
					<label key={opt.value} className="flex items-center gap-2 cursor-pointer">
						<input
							type="radio"
							name={label}
							value={opt.value}
							checked={value === opt.value}
							onChange={() => onChange(opt.value)}
							className="accent-primary"
						/>
						<span className="text-sm">{opt.label}</span>
					</label>
				))}
			</div>
		</div>
	);
}

const TeamSettingsPage = () => {
	const [selectedPreset, setSelectedPreset] = useState<PermissionPreset>("worker_limited");
	const [permissions, setPermissions] = useState<Permissions>(defaultPermissions);
	const [inviteLanguage, setInviteLanguage] = useState("english");

	const updatePermission = <K extends keyof Permissions>(key: K, value: Permissions[K]) => {
		setPermissions((prev) => ({ ...prev, [key]: value }));
		setSelectedPreset("custom");
	};

	return (
		<div className="max-w-3xl">
			<div className="flex items-center justify-between mb-6">
				<h2 className="text-2xl font-semibold">New User</h2>
			</div>

			<div className="space-y-8">
				{/* Personal Info */}
				<Card>
					<CardHeader>
						<CardTitle>Personal info</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="space-y-2">
							<Label>Full name</Label>
							<Input placeholder="Full name" />
						</div>
						<div className="space-y-2">
							<Label>Email address</Label>
							<Input type="email" placeholder="Email address" />
						</div>
						<div className="space-y-2">
							<Label>Mobile phone number (if applicable)</Label>
							<Input placeholder="Mobile phone number" />
						</div>
						<div className="space-y-2">
							<Label>Street address</Label>
							<Input placeholder="Street address" />
						</div>
						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label>City</Label>
								<Input placeholder="City" />
							</div>
							<div className="space-y-2">
								<Label>Province</Label>
								<Input placeholder="Province" />
							</div>
						</div>
						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label>Postal code</Label>
								<Input placeholder="Postal code" />
							</div>
							<div className="space-y-2">
								<Label>Country</Label>
								<Input placeholder="Country" />
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Labor Cost */}
				<Card>
					<CardHeader>
						<CardTitle>Labor cost</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="space-y-2">
							<Label>Employee cost</Label>
							<div className="flex items-center gap-2">
								<div className="relative flex-1">
									<span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
									<Input type="number" min={0} step="0.01" className="pl-7" placeholder="0.00" />
								</div>
								<span className="text-sm text-muted-foreground whitespace-nowrap">per hour</span>
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Permissions */}
				<Card>
					<CardHeader>
						<CardTitle>Permissions</CardTitle>
						<p className="text-sm text-muted-foreground">
							This allows them access to everything within the account — including billing, reports, client list, editing all user permissions, etc.
						</p>
					</CardHeader>
					<CardContent className="space-y-6">
						{/* Preset Levels */}
						<div className="space-y-3">
							<h4 className="text-sm font-semibold">Preset permission levels</h4>
							<p className="text-xs text-muted-foreground">
								Start with a preset permission level, and customize further as needed.
							</p>
							<div className="space-y-2">
								{presets.map((preset) => (
									<label
										key={preset.value}
										className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
											selectedPreset === preset.value ? "border-primary bg-primary/5" : ""
										}`}
									>
										<input
											type="radio"
											name="preset"
											value={preset.value}
											checked={selectedPreset === preset.value}
											onChange={() => setSelectedPreset(preset.value)}
											className="accent-primary mt-0.5"
										/>
										<div>
											<p className="text-sm font-medium">{preset.label}</p>
											{preset.description && (
												<p className="text-xs text-muted-foreground">{preset.description}</p>
											)}
										</div>
									</label>
								))}
							</div>
						</div>

						<hr />

						{/* Schedule */}
						<PermissionRadioGroup
							label="Schedule"
							value={permissions.schedule}
							onChange={(v) => updatePermission("schedule", v)}
							options={[
								{ value: "view_own", label: "View their own schedule" },
								{ value: "view_complete_own", label: "View and complete their own schedule" },
								{ value: "edit_own", label: "Edit their own schedule" },
								{ value: "edit_all", label: "Edit everyone's schedule" },
								{ value: "edit_delete_all", label: "Edit and delete everyone's schedule" },
							]}
						/>

						<hr />

						{/* Time Tracking */}
						<PermissionRadioGroup
							label="Time tracking and timesheets"
							value={permissions.timeTracking}
							onChange={(v) => updatePermission("timeTracking", v)}
							options={[
								{ value: "view_own", label: "View and record their own" },
								{ value: "edit_own", label: "View, record, and edit their own" },
								{ value: "edit_all", label: "View, record, and edit everyone's" },
							]}
						/>

						<hr />

						{/* Notes */}
						<PermissionRadioGroup
							label="Notes"
							description="Includes all notes across Jobber. You can hide notes for a feature by turning off permissions for that feature."
							value={permissions.notes}
							onChange={(v) => updatePermission("notes", v)}
							options={[
								{ value: "view_jobs_visits", label: "View notes on jobs and visits only" },
								{ value: "view_all", label: "View all notes" },
								{ value: "view_edit_all", label: "View and edit all" },
								{ value: "view_edit_delete_all", label: "View, edit, and delete all" },
							]}
						/>

						<hr />

						{/* Expenses */}
						<PermissionRadioGroup
							label="Expenses"
							value={permissions.expenses}
							onChange={(v) => updatePermission("expenses", v)}
							options={[
								{ value: "view_own", label: "View, record, and edit their own" },
								{ value: "view_all", label: "View, record, and edit everyone's" },
							]}
						/>

						<hr />

						{/* Show Pricing */}
						<div className="space-y-2">
							<div className="flex items-center justify-between">
								<div>
									<h4 className="text-sm font-semibold">Show pricing</h4>
									<p className="text-xs text-muted-foreground">
										Allows editing of quotes, invoices, and line items on jobs.
									</p>
								</div>
								<Switch
									checked={permissions.showPricing}
									onCheckedChange={(v) => updatePermission("showPricing", v)}
								/>
							</div>
						</div>

						<hr />

						{/* Job Costing */}
						<div className="space-y-2">
							<div className="flex items-center justify-between">
								<div>
									<h4 className="text-sm font-semibold">Job costing</h4>
									<p className="text-xs text-muted-foreground">
										Show job profit by tracking revenue and costs from line items, labor, and expenses.
									</p>
									<p className="text-xs text-muted-foreground mt-1">
										Turn on show pricing, timesheets, expenses, and jobs to give access to job costing.
									</p>
								</div>
								<Switch
									checked={permissions.jobCosting}
									onCheckedChange={(v) => updatePermission("jobCosting", v)}
								/>
							</div>
						</div>

						<hr />

						{/* Clients and Properties */}
						<PermissionRadioGroup
							label="Clients and properties"
							description="Includes access to all client custom fields."
							value={permissions.clientsProperties}
							onChange={(v) => updatePermission("clientsProperties", v)}
							options={[
								{ value: "view_name_address", label: "View client name and address only" },
								{ value: "view_full", label: "View full client and property info" },
								{ value: "view_edit_full", label: "View and edit full client and property info" },
								{ value: "view_edit_delete_full", label: "View, edit, and delete full client and property info" },
							]}
						/>

						<hr />

						{/* Requests */}
						<PermissionRadioGroup
							label="Requests"
							value={permissions.requests}
							onChange={(v) => updatePermission("requests", v)}
							options={[
								{ value: "view", label: "View only" },
								{ value: "view_create_edit", label: "View, create, and edit" },
								{ value: "view_create_edit_delete", label: "View, create, edit, and delete" },
							]}
						/>

						<hr />

						{/* Quotes */}
						<PermissionRadioGroup
							label="Quotes"
							value={permissions.quotes}
							onChange={(v) => updatePermission("quotes", v)}
							options={[
								{ value: "view", label: "View only" },
								{ value: "view_create_edit", label: "View, create, and edit" },
								{ value: "view_create_edit_delete", label: "View, create, edit, and delete" },
							]}
						/>

						<hr />

						{/* Jobs */}
						<div className="space-y-3">
							<PermissionRadioGroup
								label="Jobs"
								value={permissions.jobs}
								onChange={(v) => updatePermission("jobs", v)}
								options={[
									{ value: "view", label: "View only" },
									{ value: "view_create_edit", label: "View, create, and edit" },
									{ value: "view_create_edit_delete", label: "View, create, edit, and delete" },
								]}
							/>
							<p className="text-xs text-muted-foreground">
								Select edit their own schedule to create and edit jobs.
							</p>
						</div>

						<hr />

						{/* Invoices */}
						<PermissionRadioGroup
							label="Invoices"
							value={permissions.invoices}
							onChange={(v) => updatePermission("invoices", v)}
							options={[
								{ value: "view", label: "View only" },
								{ value: "view_create_edit", label: "View, create, and edit" },
								{ value: "view_create_edit_delete", label: "View, create, edit, and delete" },
							]}
						/>

						<hr />

						{/* Payments */}
						<div className="space-y-2">
							<div className="flex items-center justify-between">
								<div>
									<h4 className="text-sm font-semibold">Payments</h4>
									<p className="text-xs text-muted-foreground">
										Allow payment collection on quotes and invoices. Turning this on will apply the required permissions below. If any of them are removed, payments will also be removed automatically.
									</p>
								</div>
								<Switch
									checked={permissions.payments}
									onCheckedChange={(v) => updatePermission("payments", v)}
								/>
							</div>
							{permissions.payments && (
								<div className="rounded-md bg-muted/50 p-3 text-xs text-muted-foreground space-y-1">
									<p className="font-medium text-foreground">Required permissions:</p>
									<ul className="list-disc list-inside space-y-0.5">
										<li>Show pricing</li>
										<li>Clients and Properties: Edit access</li>
										<li>Quotes and/or Invoices: Edit access</li>
									</ul>
								</div>
							)}
						</div>

						<hr />

						{/* Reports */}
						<div className="space-y-2">
							<div className="flex items-center justify-between">
								<div>
									<h4 className="text-sm font-semibold">Reports</h4>
									<p className="text-xs text-muted-foreground">
										Users will only be able to see reports available to them based on their other permissions.
									</p>
								</div>
								<Switch
									checked={permissions.reports}
									onCheckedChange={(v) => updatePermission("reports", v)}
								/>
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Communications */}
				<Card>
					<CardHeader>
						<CardTitle>Communications</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<h4 className="text-sm font-semibold">Email subscriptions</h4>
						<div className="flex items-center gap-2">
							<Checkbox id="surveys" />
							<Label htmlFor="surveys" className="font-normal text-sm">
								Receive occasional surveys to tell us how we're doing
							</Label>
						</div>
					</CardContent>
				</Card>

				{/* Invitation Language */}
				<Card>
					<CardHeader>
						<CardTitle>Invitation language</CardTitle>
						<p className="text-sm text-muted-foreground">
							The chosen language only applies to the invitation and cannot be changed once sent.
						</p>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="space-y-2">
							{[
								{ value: "english", label: "English" },
								{ value: "spanish", label: "Spanish" },
							].map((lang) => (
								<label key={lang.value} className="flex items-center gap-2 cursor-pointer">
									<input
										type="radio"
										name="language"
										value={lang.value}
										checked={inviteLanguage === lang.value}
										onChange={() => setInviteLanguage(lang.value)}
										className="accent-primary"
									/>
									<span className="text-sm">{lang.label}</span>
								</label>
							))}
						</div>
						<p className="text-xs text-muted-foreground">
							The mobile app is available in Spanish only to non-admin users who have their phone language set to Spanish
						</p>
					</CardContent>
				</Card>

				{/* Submit */}
				<div className="flex gap-2 pb-8">
					<Button>Add User</Button>
				</div>
			</div>
		</div>
	);
};

export default TeamSettingsPage;
