import { useParams, useNavigate } from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
	getClientById,
	getClientProperties,
	getClientContacts,
	getCustomFieldDefinitions,
	archiveClient,
	deleteClient,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Mail,
	Pencil,
	MoreHorizontal,
	Plus,
	Phone,
	Archive,
	Trash2,
	Tag,
} from "lucide-react";

const statusColors: Record<string, string> = {
	lead: "bg-blue-100 text-blue-800",
	active: "bg-green-100 text-green-800",
	inactive: "bg-gray-100 text-gray-800",
};

const ClientDetailPage = () => {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const queryClient = useQueryClient();

	const { data: client, isLoading } = useQuery({
		queryKey: ["client", id],
		queryFn: () => getClientById(id!),
		enabled: !!id,
	});

	const { data: properties = [] } = useQuery({
		queryKey: ["client-properties", id],
		queryFn: () => getClientProperties(id!),
		enabled: !!id,
	});

	const { data: contacts = [] } = useQuery({
		queryKey: ["client-contacts", id],
		queryFn: () => getClientContacts(id!),
		enabled: !!id,
	});

	const { data: customFields = [] } = useQuery({
		queryKey: ["custom-field-definitions", "client"],
		queryFn: () => getCustomFieldDefinitions("client"),
	});

	const archiveMutation = useMutation({
		mutationFn: archiveClient,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["client", id] });
		},
	});

	const deleteMutation = useMutation({
		mutationFn: deleteClient,
		onSuccess: () => {
			navigate("/clients");
		},
	});

	if (isLoading) {
		return <p className="text-muted-foreground p-4">Loading...</p>;
	}

	if (!client) {
		return <p className="text-muted-foreground p-4">Client not found</p>;
	}

	const displayName = client.useCompanyAsPrimary && client.companyName
		? client.companyName
		: `${client.title !== "none" ? `${client.title} ` : ""}${client.firstName} ${client.lastName}`;

	return (
		<div className="max-w-7xl mx-auto">
			{/* Header */}
			<div className="flex items-center justify-between mb-6">
				<div className="flex items-center gap-3">
					<h2 className="text-2xl font-semibold">{displayName}</h2>
					<Badge className={statusColors[client.status]}>{client.status}</Badge>
				</div>
				<div className="flex items-center gap-2">
					{client.emails[0]?.value && (
						<Button variant="outline" size="sm" asChild>
							<a href={`mailto:${client.emails[0].value}`}>
								<Mail className="h-4 w-4 mr-1" />
								Email
							</a>
						</Button>
					)}
					<Button variant="outline" size="sm" onClick={() => navigate(`/clients/${id}/edit`)}>
						<Pencil className="h-4 w-4 mr-1" />
						Edit
					</Button>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="outline" size="sm">
								<MoreHorizontal className="h-4 w-4 mr-1" />
								More Actions
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuItem onClick={() => archiveMutation.mutate(client.id)}>
								<Archive className="h-4 w-4 mr-2" />
								Archive
							</DropdownMenuItem>
							<DropdownMenuItem
								className="text-destructive"
								onClick={() => deleteMutation.mutate(client.id)}
							>
								<Trash2 className="h-4 w-4 mr-2" />
								Delete
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</div>

			{/* Two Column Layout */}
			<div className="grid grid-cols-[1fr_380px] gap-6">
				{/* Left - Main Content */}
				<div className="space-y-6">
					{/* Properties */}
					<Card>
						<CardHeader className="pb-3">
							<div className="flex items-center justify-between">
								<CardTitle className="text-sm font-semibold">Properties</CardTitle>
								<Button variant="ghost" size="sm" className="h-7 text-xs">
									<Plus className="h-3 w-3 mr-1" />
									New Property
								</Button>
							</div>
						</CardHeader>
						<CardContent className="space-y-3">
							{properties.length === 0 && (
								<p className="text-sm text-muted-foreground">No properties</p>
							)}
							{properties.map((prop) => (
								<div key={prop.id} className="text-sm space-y-0.5">
									{prop.street1 && <p>{prop.street1}</p>}
									{prop.street2 && <p>{prop.street2}</p>}
									{prop.city && <p>{prop.city}</p>}
									{prop.state && <p>{prop.state}</p>}
									{prop.zip && <p>{prop.zip}</p>}
								</div>
							))}
						</CardContent>
					</Card>

					{/* Contacts */}
					<Card>
						<CardHeader className="pb-3">
							<CardTitle className="text-sm font-semibold">Contacts</CardTitle>
						</CardHeader>
						<CardContent>
							{contacts.length === 0 ? (
								<p className="text-sm text-muted-foreground">No contacts found</p>
							) : (
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead className="text-xs">Name</TableHead>
											<TableHead className="text-xs">Role</TableHead>
											<TableHead className="text-xs">Phone</TableHead>
											<TableHead className="text-xs">Email</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{contacts.map((contact) => (
											<TableRow key={contact.id}>
												<TableCell className="text-xs">
													{contact.title !== "none" ? `${contact.title} ` : ""}
													{contact.firstName} {contact.lastName}
												</TableCell>
												<TableCell className="text-xs">{contact.role ?? "—"}</TableCell>
												<TableCell className="text-xs">{contact.phone ?? "—"}</TableCell>
												<TableCell className="text-xs">{contact.email ?? "—"}</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							)}
						</CardContent>
					</Card>

					{/* Overview */}
					<Card>
						<CardHeader className="pb-3">
							<CardTitle className="text-sm font-semibold">Overview</CardTitle>
						</CardHeader>
						<CardContent>
							<Tabs defaultValue="active-work">
								<TabsList>
									<TabsTrigger value="new">New</TabsTrigger>
									<TabsTrigger value="active-work">Active Work</TabsTrigger>
									<TabsTrigger value="requests">Requests</TabsTrigger>
									<TabsTrigger value="quotes">Quotes</TabsTrigger>
									<TabsTrigger value="jobs">Jobs</TabsTrigger>
									<TabsTrigger value="invoices">Invoices</TabsTrigger>
								</TabsList>
								<TabsContent value="new" className="pt-4">
									<p className="text-sm text-muted-foreground">No new items</p>
								</TabsContent>
								<TabsContent value="active-work" className="pt-4">
									<div className="text-center py-8">
										<p className="text-sm font-medium">No active work</p>
										<p className="text-sm text-muted-foreground mt-1">
											No active jobs, invoices or quotes for this client yet
										</p>
									</div>
								</TabsContent>
								<TabsContent value="requests" className="pt-4">
									<p className="text-sm text-muted-foreground">No requests</p>
								</TabsContent>
								<TabsContent value="quotes" className="pt-4">
									<p className="text-sm text-muted-foreground">No quotes</p>
								</TabsContent>
								<TabsContent value="jobs" className="pt-4">
									<p className="text-sm text-muted-foreground">No jobs</p>
								</TabsContent>
								<TabsContent value="invoices" className="pt-4">
									<p className="text-sm text-muted-foreground">No invoices</p>
								</TabsContent>
							</Tabs>
						</CardContent>
					</Card>

					{/* Schedule */}
					<Card>
						<CardHeader className="pb-3">
							<div className="flex items-center justify-between">
								<CardTitle className="text-sm font-semibold">Schedule</CardTitle>
								<Button variant="ghost" size="sm" className="h-7 text-xs">
									<Plus className="h-3 w-3 mr-1" />
									New
								</Button>
							</div>
						</CardHeader>
						<CardContent>
							<div className="text-center py-8">
								<p className="text-sm font-medium">No scheduled items</p>
								<p className="text-sm text-muted-foreground mt-1">
									Nothing is scheduled for this client yet
								</p>
							</div>
						</CardContent>
					</Card>
				</div>

				{/* Right Sidebar */}
				<div className="space-y-6">
					{/* Contact Info */}
					<Card>
						<CardHeader className="pb-3">
							<CardTitle className="text-sm font-semibold">Contact info</CardTitle>
						</CardHeader>
						<CardContent className="space-y-3">
							{client.phones.map((phone, i) => (
								<div key={i} className="flex items-center gap-2 text-sm">
									<Phone className="h-4 w-4 text-muted-foreground" />
									<div>
										<p className="text-xs text-muted-foreground capitalize">{phone.type}</p>
										<a href={`tel:${phone.number}`} className="text-primary hover:underline">
											{phone.number}
										</a>
									</div>
								</div>
							))}
							{client.emails.map((email, i) => (
								<div key={i} className="flex items-center gap-2 text-sm">
									<Mail className="h-4 w-4 text-muted-foreground" />
									<div>
										<p className="text-xs text-muted-foreground capitalize">{email.type}</p>
										<a href={`mailto:${email.value}`} className="text-primary hover:underline">
											{email.value}
										</a>
									</div>
								</div>
							))}
							{/* Lead Source */}
							<div className="pt-2 border-t">
								<p className="text-xs text-muted-foreground">Lead Source</p>
								{client.leadSource ? (
									<p className="text-sm capitalize">{client.leadSource.replace("_", " ")}</p>
								) : (
									<Button variant="link" className="p-0 h-auto text-sm">Add</Button>
								)}
							</div>

							{/* Custom Fields */}
							{customFields.length > 0 && customFields.map((cf) => (
								<div key={cf.id} className="pt-2 border-t">
									<p className="text-xs text-muted-foreground">{cf.name}</p>
									<p className="text-sm">{cf.defaultValue || "Nil"}</p>
								</div>
							))}
						</CardContent>
					</Card>

					{/* Tags */}
					<Card>
						<CardHeader className="pb-3">
							<div className="flex items-center justify-between">
								<CardTitle className="text-sm font-semibold">Tags</CardTitle>
								<Button variant="ghost" size="sm" className="h-7 text-xs">
									<Tag className="h-3 w-3 mr-1" />
									New Tag
								</Button>
							</div>
						</CardHeader>
						<CardContent>
							<p className="text-sm text-muted-foreground">This client has no tags</p>
						</CardContent>
					</Card>

					{/* Last Client Communication */}
					<Card>
						<CardHeader className="pb-3">
							<CardTitle className="text-sm font-semibold">Last client communication</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-sm text-muted-foreground">
								You haven't sent any client communications yet
							</p>
						</CardContent>
					</Card>

					{/* Billing History */}
					<Card>
						<CardHeader className="pb-3">
							<div className="flex items-center justify-between">
								<CardTitle className="text-sm font-semibold">Billing history</CardTitle>
								<Button variant="ghost" size="sm" className="h-7 text-xs">
									<Plus className="h-3 w-3 mr-1" />
									New
								</Button>
							</div>
						</CardHeader>
						<CardContent className="space-y-3">
							<p className="text-sm text-muted-foreground">
								This client hasn't been billed yet
							</p>
							<div className="flex items-center justify-between pt-2 border-t">
								<p className="text-sm font-medium">Current balance</p>
								<p className="text-sm font-semibold">$0.00</p>
							</div>
						</CardContent>
					</Card>

					{/* Internal Notes */}
					<Card>
						<CardHeader className="pb-3">
							<CardTitle className="text-sm font-semibold">Internal notes</CardTitle>
							<p className="text-xs text-muted-foreground">
								Internal notes will only be seen by your team
							</p>
						</CardHeader>
						<CardContent className="space-y-3">
							<Textarea placeholder="Note details" rows={3} />
							<div className="rounded-lg border border-dashed p-4 text-center">
								<p className="text-sm text-muted-foreground">
									Drag your files here or{" "}
									<Button variant="link" className="p-0 h-auto text-sm">Select a File</Button>
								</p>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
};

export default ClientDetailPage;
