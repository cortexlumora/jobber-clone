import { useState } from "react";
import { useNavigate } from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from "@/components/ui/dialog";
import { Clock, MapPin, Pencil, Plus, Trash2 } from "lucide-react";
import {
	getRequestForms,
	createRequestForm,
	deleteRequestForm,
	getBookableServices,
	createBookableService,
	updateBookableServiceApi,
	deleteBookableService,
	getRequestsBookingsSettings,
	updateRequestsBookingsSettings,
	getTeamMembers,
} from "../api";
import type { BookableServiceDTO } from "@repo/dto";

const formatDuration = (minutes: number) => {
	if (minutes < 60) return `${minutes}min`;
	const h = Math.floor(minutes / 60);
	const m = minutes % 60;
	return m > 0 ? `${h}h ${m}min` : `${h}h`;
};

const formatPrice = (price: string) => {
	const num = parseFloat(price);
	return num === 0 ? "$0" : `$${num.toFixed(2)}`;
};

const RequestsBookingsPage = () => {
	const queryClient = useQueryClient();
	const navigate = useNavigate();
	const [activeTab, setActiveTab] = useState("requests");

	// New form dialog
	const [formDialogOpen, setFormDialogOpen] = useState(false);
	const formForm = useForm<{ name: string; description: string }>({ defaultValues: { name: "", description: "" } });

	// New service dialog
	const [serviceDialogOpen, setServiceDialogOpen] = useState(false);
	const [editingService, setEditingService] = useState<BookableServiceDTO | null>(null);
	const serviceForm = useForm<{
		name: string;
		description: string;
		durationMinutes: number;
		price: string;
	}>({ defaultValues: { name: "", description: "", durationMinutes: 60, price: "0" } });

	// Queries
	const { data: forms = [] } = useQuery({
		queryKey: ["request-forms"],
		queryFn: getRequestForms,
	});

	const { data: services = [] } = useQuery({
		queryKey: ["bookable-services"],
		queryFn: getBookableServices,
	});

	const { data: settings } = useQuery({
		queryKey: ["requests-bookings-settings"],
		queryFn: getRequestsBookingsSettings,
	});

	const { data: teamMembers = [] } = useQuery({
		queryKey: ["team-members"],
		queryFn: getTeamMembers,
	});

	// Mutations
	const createFormMutation = useMutation({
		mutationFn: createRequestForm,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["request-forms"] });
			setFormDialogOpen(false);
			formForm.reset();
		},
	});

	const deleteFormMutation = useMutation({
		mutationFn: deleteRequestForm,
		onSuccess: () => queryClient.invalidateQueries({ queryKey: ["request-forms"] }),
	});

	const createServiceMutation = useMutation({
		mutationFn: createBookableService,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["bookable-services"] });
			setServiceDialogOpen(false);
			serviceForm.reset();
		},
	});

	const updateServiceMutation = useMutation({
		mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateBookableServiceApi>[1] }) =>
			updateBookableServiceApi(id, data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["bookable-services"] });
			setServiceDialogOpen(false);
			setEditingService(null);
			serviceForm.reset();
		},
	});

	const deleteServiceMutation = useMutation({
		mutationFn: deleteBookableService,
		onSuccess: () => queryClient.invalidateQueries({ queryKey: ["bookable-services"] }),
	});

	const updateSettingsMutation = useMutation({
		mutationFn: updateRequestsBookingsSettings,
		onSuccess: () => queryClient.invalidateQueries({ queryKey: ["requests-bookings-settings"] }),
	});

	const openEditService = (service: BookableServiceDTO) => {
		setEditingService(service);
		serviceForm.reset({
			name: service.name,
			description: service.description ?? "",
			durationMinutes: service.durationMinutes,
			price: service.price,
		});
		setServiceDialogOpen(true);
	};

	const openNewService = () => {
		setEditingService(null);
		serviceForm.reset({ name: "", description: "", durationMinutes: 60, price: "0" });
		setServiceDialogOpen(true);
	};

	const handleServiceSubmit = serviceForm.handleSubmit((data) => {
		if (editingService) {
			updateServiceMutation.mutate({ id: editingService.id, data });
		} else {
			createServiceMutation.mutate(data);
		}
	});

	return (
		<div className="max-w-3xl">
			<h2 className="text-2xl font-semibold mb-2">Requests and bookings</h2>

			<Tabs value={activeTab} onValueChange={setActiveTab}>
				<TabsList variant="line" className="mb-6">
					<TabsTrigger value="requests">Requests</TabsTrigger>
					<TabsTrigger value="bookings">Bookings</TabsTrigger>
				</TabsList>

				{/* REQUESTS TAB */}
				<TabsContent value="requests" className="space-y-8">
					<p className="text-sm text-muted-foreground">
						Track and manage all incoming work requests in one place. Customize your request form to
						capture all the information you need and then share it on your website, social media, or
						Client Hub for customers to fill-out directly, at any time.
					</p>

					{/* Forms */}
					<div className="space-y-4">
						<div className="flex items-center justify-between">
							<h3 className="text-lg font-medium">Forms</h3>
							<Button size="sm" variant="outline" onClick={() => setFormDialogOpen(true)}>
								<Plus className="size-4 mr-1" />
								Add New Form
							</Button>
						</div>
						<div className="rounded-lg border divide-y">
							{forms.map((form) => (
								<div
									key={form.id}
									className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-accent/50 transition-colors"
									onClick={() => navigate(`/settings/requests-bookings/forms/${form.id}`)}
								>
									<div>
										<p className="text-sm font-medium">{form.name}</p>
										{form.isDefault && (
											<p className="text-xs text-muted-foreground">Request default</p>
										)}
									</div>
									{!form.isDefault && (
										<Button
											variant="ghost"
											size="sm"
											onClick={() => deleteFormMutation.mutate(form.id)}
										>
											<Trash2 className="size-4" />
										</Button>
									)}
								</div>
							))}
							{forms.length === 0 && (
								<div className="px-4 py-6 text-center text-sm text-muted-foreground">
									No forms yet. Add your first request form.
								</div>
							)}
						</div>
					</div>

					{/* Customization */}
					<div className="space-y-3">
						<h3 className="text-lg font-medium">Customization</h3>
						<p className="text-sm text-muted-foreground">
							Personalize your forms with your brand
						</p>
						<div className="rounded-lg border p-4">
							<p className="text-sm text-muted-foreground">
								Add your logo and customize colors to match your business style. Branding can be
								updated in Business Profile.
							</p>
						</div>
					</div>

					{/* Availability */}
					<div className="space-y-3">
						<h3 className="text-lg font-medium">Availability</h3>
						<div className="rounded-lg border p-4">
							<p className="text-sm font-medium">Business Hours</p>
							<p className="text-sm text-muted-foreground">
								The days specified in your company's business hours are available for online
								booking. Business hours can be updated in Company Settings.
							</p>
						</div>
					</div>

					{/* Share request form */}
					<div className="space-y-3">
						<h3 className="text-lg font-medium">Share request form</h3>
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm font-medium">Visible to clients and customers</p>
								<p className="text-sm text-muted-foreground">
									Allow customers to submit requests online through Client Hub, your website
									and on social media.
								</p>
							</div>
							<Switch
								checked={settings?.requestFormVisible ?? true}
								onCheckedChange={(checked) =>
									updateSettingsMutation.mutate({ requestFormVisible: checked })
								}
							/>
						</div>
					</div>
				</TabsContent>

				{/* BOOKINGS TAB */}
				<TabsContent value="bookings" className="space-y-8">
					<p className="text-sm text-muted-foreground">
						Streamline your scheduling by letting leads and customers book an appointment with you
						online. New jobs will keep rolling in, while you remain in total control of what services
						and availability you offer online.
					</p>

					{/* Bookable Services */}
					<div className="space-y-4">
						<div className="flex items-center justify-between">
							<h3 className="text-lg font-medium">Bookable services</h3>
							<Button size="sm" variant="outline" onClick={openNewService}>
								<Plus className="size-4 mr-1" />
								Add service
							</Button>
						</div>
						<div className="rounded-lg border divide-y">
							{services.map((service) => (
								<div key={service.id} className="flex items-center justify-between px-4 py-3">
									<div className="space-y-1">
										<p className="text-sm font-medium">{service.name}</p>
										{service.description && (
											<p className="text-xs text-muted-foreground">{service.description}</p>
										)}
										<p className="text-xs text-muted-foreground">
											{formatDuration(service.durationMinutes)} &bull; {formatPrice(service.price)}
										</p>
									</div>
									<div className="flex items-center gap-1">
										<Button variant="ghost" size="sm" onClick={() => openEditService(service)}>
											<Pencil className="size-4" />
										</Button>
										<Button
											variant="ghost"
											size="sm"
											onClick={() => deleteServiceMutation.mutate(service.id)}
										>
											<Trash2 className="size-4" />
										</Button>
									</div>
								</div>
							))}
							{services.length === 0 && (
								<div className="px-4 py-6 text-center text-sm text-muted-foreground">
									No bookable services yet. Add your first service.
								</div>
							)}
						</div>
					</div>

					{/* Availability */}
					<div className="space-y-3">
						<h3 className="text-lg font-medium">Availability</h3>
						<div className="rounded-lg border p-4 space-y-2">
							<div className="flex items-center gap-2">
								<Clock className="size-4 text-muted-foreground" />
								<p className="text-sm font-medium">Efficient scheduling</p>
							</div>
							<p className="text-sm text-muted-foreground">
								{settings?.maxDriveTimeMinutes ?? 30} minutes maximum drive time between appointments
							</p>
							<Button
								variant="link"
								size="sm"
								className="px-0 h-auto text-xs"
								onClick={() => {
									const minutes = prompt("Maximum drive time in minutes:", String(settings?.maxDriveTimeMinutes ?? 30));
									if (minutes) {
										updateSettingsMutation.mutate({ maxDriveTimeMinutes: parseInt(minutes) });
									}
								}}
							>
								Edit
							</Button>
						</div>
					</div>

					{/* Service area */}
					<div className="space-y-3">
						<h3 className="text-lg font-medium">Service area</h3>
						<div className="rounded-lg border p-4 space-y-2">
							<div className="flex items-center gap-2">
								<MapPin className="size-4 text-muted-foreground" />
								<p className="text-sm text-muted-foreground">
									{settings?.serviceAreaEnabled
										? "Bookings are limited by your service area"
										: "Bookings aren't limited by a service area"}
								</p>
							</div>
							<Button
								variant="link"
								size="sm"
								className="px-0 h-auto text-xs"
								onClick={() =>
									updateSettingsMutation.mutate({
										serviceAreaEnabled: !settings?.serviceAreaEnabled,
									})
								}
							>
								Edit
							</Button>
						</div>
					</div>

					{/* Bookable team members */}
					<div className="space-y-3">
						<h3 className="text-lg font-medium">Bookable team members</h3>
						<p className="text-sm text-muted-foreground">
							Team members' set hours are used for their availability. Adjust their bookable days
							and hours in Manage Team.
						</p>
						<div className="rounded-lg border divide-y">
							{teamMembers.map((member) => {
								const isBookable = settings?.bookableTeamMemberIds?.includes(member.id) ?? false;
								return (
									<div key={member.id} className="flex items-center justify-between px-4 py-3">
										<div className="flex items-center gap-3">
											<div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
												{member.name
													.split(" ")
													.map((n) => n[0])
													.join("")
													.toUpperCase()
													.slice(0, 2)}
											</div>
											<p className="text-sm font-medium">{member.name}</p>
										</div>
										<Switch
											checked={isBookable}
											onCheckedChange={(checked) => {
												const currentIds = settings?.bookableTeamMemberIds ?? [];
												const newIds = checked
													? [...currentIds, member.id]
													: currentIds.filter((id) => id !== member.id);
												updateSettingsMutation.mutate({ bookableTeamMemberIds: newIds });
											}}
										/>
									</div>
								);
							})}
							{teamMembers.length === 0 && (
								<div className="px-4 py-6 text-center text-sm text-muted-foreground">
									No team members found.
								</div>
							)}
						</div>
					</div>

					{/* Advanced settings */}
					<div className="space-y-3">
						<h3 className="text-lg font-medium">Advanced settings</h3>
						<div className="rounded-lg border p-4">
							<p className="text-sm text-muted-foreground">
								Advanced booking configuration options coming soon.
							</p>
						</div>
					</div>
				</TabsContent>
			</Tabs>

			{/* New Form Dialog */}
			<Dialog open={formDialogOpen} onOpenChange={setFormDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>New form</DialogTitle>
					</DialogHeader>
					<p className="text-sm text-muted-foreground">
						Start by entering some basic information about the form and the type of information
						you're looking to capture.
					</p>
					<form
						onSubmit={formForm.handleSubmit((data) => createFormMutation.mutate(data))}
						className="space-y-4"
					>
						<div className="space-y-2">
							<Label htmlFor="formName">Add a form title</Label>
							<Input
								id="formName"
								placeholder="Add a form title"
								{...formForm.register("name", { required: true })}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="formDescription">
								Add a short description of your services or other details to appear above your form
							</Label>
							<Input
								id="formDescription"
								placeholder="Add a short description"
								{...formForm.register("description")}
							/>
						</div>
						<DialogFooter>
							<Button type="button" variant="outline" onClick={() => setFormDialogOpen(false)}>
								Back
							</Button>
							<Button type="submit" disabled={createFormMutation.isPending}>
								{createFormMutation.isPending ? "Creating..." : "Create form"}
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>

			{/* New/Edit Service Dialog */}
			<Dialog
				open={serviceDialogOpen}
				onOpenChange={(open) => {
					setServiceDialogOpen(open);
					if (!open) setEditingService(null);
				}}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>{editingService ? "Edit Service" : "Add Service"}</DialogTitle>
					</DialogHeader>
					<form onSubmit={handleServiceSubmit} className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="serviceName">Service Name</Label>
							<Input
								id="serviceName"
								placeholder="e.g. Free Assessment"
								{...serviceForm.register("name", { required: true })}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="serviceDescription">Description</Label>
							<Input
								id="serviceDescription"
								placeholder="Describe the service"
								{...serviceForm.register("description")}
							/>
						</div>
						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="serviceDuration">Duration (minutes)</Label>
								<Input
									id="serviceDuration"
									type="number"
									min={1}
									{...serviceForm.register("durationMinutes", { valueAsNumber: true })}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="servicePrice">Price ($)</Label>
								<Input
									id="servicePrice"
									placeholder="0.00"
									{...serviceForm.register("price")}
								/>
							</div>
						</div>
						<DialogFooter>
							<Button
								type="button"
								variant="outline"
								onClick={() => {
									setServiceDialogOpen(false);
									setEditingService(null);
								}}
							>
								Cancel
							</Button>
							<Button
								type="submit"
								disabled={createServiceMutation.isPending || updateServiceMutation.isPending}
							>
								{editingService ? "Save Changes" : "Add Service"}
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>
		</div>
	);
};

export default RequestsBookingsPage;
