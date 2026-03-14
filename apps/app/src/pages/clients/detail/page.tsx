import { useParams, useNavigate } from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
	getClientById,
	archiveClient,
	deleteClient,
} from "../api";
import { getCustomFieldDefinitions } from "@/pages/settings/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import InternalNotesCard from "./components/internal-notes-card";
import ContactsCard from "./components/contacts-card";
import PropertiesCard from "./components/properties-card";
import TagsCard from "./components/tags-card";
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
					<PropertiesCard clientId={id!} />

					{/* Contacts */}
					<ContactsCard clientId={id!} />

					{/* Overview */}
					<div className="rounded-xl px-2 border bg-background">
						<div className="py-4 px-2">
							<h3 className="text-lg font-medium">Overview</h3>
						</div>
						<div className="px-2 pb-4 min-h-[280px] flex flex-col">
							<Tabs defaultValue="active-work" className="flex-1 flex flex-col">
								<TabsList variant="line">
									<TabsTrigger value="new">New</TabsTrigger>
									<TabsTrigger value="active-work">Active Work</TabsTrigger>
									<TabsTrigger value="requests">Requests</TabsTrigger>
									<TabsTrigger value="quotes">Quotes</TabsTrigger>
									<TabsTrigger value="jobs">Jobs</TabsTrigger>
									<TabsTrigger value="invoices">Invoices</TabsTrigger>
								</TabsList>
								<TabsContent value="new" className="pt-4 flex-1 flex flex-col">
									<div className="flex-1 flex flex-col items-center justify-center text-center py-8">
										<p className="text-sm font-medium">No new items</p>
										<p className="text-sm text-muted-foreground mt-1">
											There are no new items for this client yet
										</p>
									</div>
								</TabsContent>
								<TabsContent value="active-work" className="pt-4 flex-1 flex flex-col">
									<div className="flex-1 flex flex-col items-center justify-center text-center py-8">
										<p className="text-sm font-medium">No active work</p>
										<p className="text-sm text-muted-foreground mt-1">
											No active jobs, invoices or quotes for this client yet
										</p>
									</div>
								</TabsContent>
								<TabsContent value="requests" className="pt-4 flex-1 flex flex-col">
									<div className="flex-1 flex flex-col items-center justify-center text-center py-8">
										<p className="text-sm font-medium">Client hasn't requested any work yet</p>
										<p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
											Clients can submit new requests for work online. You and your team can also create requests to keep track of new work that comes up.
										</p>
										<Button variant="outline" size="sm" className="mt-4" onClick={() => navigate("/requests/create")}>
											<Plus className="h-3.5 w-3.5 mr-1" />
											New Request
										</Button>
									</div>
								</TabsContent>
								<TabsContent value="quotes" className="pt-4 flex-1 flex flex-col">
									<div className="flex-1 flex flex-col items-center justify-center text-center py-8">
										<p className="text-sm font-medium">No quotes</p>
										<p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
											Measure twice, cut once. Begin by creating this client's first quote.
										</p>
										<Button variant="outline" size="sm" className="mt-4" onClick={() => navigate("/quotes/create")}>
											<Plus className="h-3.5 w-3.5 mr-1" />
											New Quote
										</Button>
									</div>
								</TabsContent>
								<TabsContent value="jobs" className="pt-4 flex-1 flex flex-col">
									<div className="flex-1 flex flex-col items-center justify-center text-center py-8">
										<p className="text-sm font-medium">No jobs</p>
										<p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
											Let's get out there and work. Begin by creating this client's first job.
										</p>
										<Button variant="outline" size="sm" className="mt-4" onClick={() => navigate("/jobs/create")}>
											<Plus className="h-3.5 w-3.5 mr-1" />
											New Job
										</Button>
									</div>
								</TabsContent>
								<TabsContent value="invoices" className="pt-4 flex-1 flex flex-col">
									<div className="flex-1 flex flex-col items-center justify-center text-center py-8">
										<p className="text-sm font-medium">No invoices</p>
										<p className="text-sm text-muted-foreground mt-1">
											There are no current invoices for this client yet
										</p>
										<Button variant="outline" size="sm" className="mt-4">
											<Plus className="h-3.5 w-3.5 mr-1" />
											New Invoice
										</Button>
									</div>
								</TabsContent>
							</Tabs>
						</div>
					</div>

					{/* Schedule */}
					<div className="rounded-xl px-2 border bg-background">
						<div className="py-4 px-2 flex items-center justify-between">
							<h3 className="text-lg font-medium">Schedule</h3>
							<Button variant="ghost" size="sm" className="h-7 text-xs">
								<Plus className="h-3 w-3 mr-1" />
								New
							</Button>
						</div>
						<div className="px-2 pb-4 min-h-[200px] flex flex-col">
							<div className="flex-1 flex flex-col items-center justify-center text-center py-8">
								<p className="text-sm font-medium">No scheduled items</p>
								<p className="text-sm text-muted-foreground mt-1">
									Nothing is scheduled for this client yet
								</p>
							</div>
						</div>
					</div>
				</div>

				{/* Right Sidebar */}
				<div className="space-y-6">
					{/* Contact Info */}
					<Card>
						<CardHeader className="pb-3">
							<CardTitle className="text-lg font-medium">Contact info</CardTitle>
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
					<TagsCard clientId={id!} initialTags={client.tags ?? []} />

					{/* Last Client Communication */}
					<Card>
						<CardHeader className="pb-3">
							<CardTitle className="text-lg font-medium">Last client communication</CardTitle>
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
								<CardTitle className="text-lg font-medium">Billing history</CardTitle>
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
								<p className="text-lg font-medium">$0.00</p>
							</div>
						</CardContent>
					</Card>

					{/* Internal Notes */}
					<InternalNotesCard clientId={id!} initialNotes={client.notes} />
				</div>
			</div>
		</div>
	);
};

export default ClientDetailPage;
