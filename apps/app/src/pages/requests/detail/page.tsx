import { useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { getRequestById } from "../api";
import { getClientById } from "@/pages/clients/api";
import { getClientNotes } from "@/pages/clients/api";
import type { ClientNoteDTO } from "@repo/dto";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	Pin,
	MoreHorizontal,
	Mail,
	Phone,
	MapPin,
	Calendar,
	Bell,
	ImageIcon,
} from "lucide-react";

// ── Helpers ──────────────────────────────────────────────────────────

function formatDate(date: Date | string) {
	const d = new Date(date);
	return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatTime(date: Date | string) {
	const d = new Date(date);
	return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function formatAssessmentDate(dateStr: string, timeStr: string | null) {
	const d = new Date(dateStr + "T00:00:00");
	const formatted = d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
	if (timeStr) {
		const [hours, minutes] = timeStr.split(":");
		const date = new Date();
		date.setHours(Number(hours), Number(minutes));
		const time = date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
		return `${formatted} @ ${time}`;
	}
	return formatted;
}

function getInitials(name: string) {
	return name
		.split(" ")
		.map((n) => n[0])
		.join("")
		.slice(0, 2)
		.toUpperCase();
}

function formatCurrency(amount: number) {
	return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}

const statusConfig: Record<string, { label: string; className: string }> = {
	new: { label: "New", className: "bg-blue-100 text-blue-800" },
	assessed: { label: "Assessed", className: "bg-yellow-100 text-yellow-800" },
	converted: { label: "Converted", className: "bg-green-100 text-green-800" },
	archived: { label: "Archived", className: "bg-gray-100 text-gray-800" },
};

const reminderLabels: Record<string, string> = {
	none: "None",
	at_start: "At start time",
	"30min": "30 minutes before",
	"1hour": "1 hour before",
	"2hour": "2 hours before",
	"5hour": "5 hours before",
	"24hour": "1 day before",
};

// ── Note Item ────────────────────────────────────────────────────────

function NoteItem({ note }: { note: ClientNoteDTO }) {
	return (
		<div className={`py-3 ${note.isPinned ? "border-l-2 border-l-primary pl-3" : ""}`}>
			<div className="flex items-center gap-2 mb-1">
				<div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-medium">
					{getInitials(note.createdByName)}
				</div>
				<span className="text-xs font-medium">{note.createdByName}</span>
				{note.isPinned && <Pin className="h-3 w-3 text-primary fill-primary" />}
				<span className="text-[11px] text-muted-foreground ml-auto">
					{formatDate(note.createdAt)}, {formatTime(note.createdAt)}
				</span>
			</div>
			<p className="text-sm text-muted-foreground leading-relaxed">{note.content}</p>
		</div>
	);
}

// ── Section wrapper ──────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
	return (
		<div className="rounded-lg border bg-background">
			<div className="px-5 py-3 border-b">
				<h3 className="text-sm font-semibold">{title}</h3>
			</div>
			<div className="px-5 py-4">{children}</div>
		</div>
	);
}

// ── Main Page ────────────────────────────────────────────────────────

const RequestDetailPage = () => {
	const { id } = useParams<{ id: string }>();

	const { data: request, isLoading } = useQuery({
		queryKey: ["request", id],
		queryFn: () => getRequestById(id!),
		enabled: !!id,
	});

	const { data: client } = useQuery({
		queryKey: ["client", request?.clientId],
		queryFn: () => getClientById(request!.clientId),
		enabled: !!request?.clientId,
	});

	const { data: notes = [] } = useQuery({
		queryKey: ["client-notes", request?.clientId],
		queryFn: () => getClientNotes(request!.clientId),
		enabled: !!request?.clientId,
	});

	if (isLoading) {
		return <p className="text-muted-foreground p-4">Loading...</p>;
	}

	if (!request) {
		return <p className="text-muted-foreground p-4">Request not found</p>;
	}

	const status = statusConfig[request.status] ?? statusConfig.new;
	const property = client?.propertyDetails?.data?.[0];
	const address = property
		? [property.street1, property.street2, property.city, property.state, property.zip]
				.filter(Boolean)
				.join(", ")
		: null;

	const clientDisplayName = client
		? client.useCompanyAsPrimary && client.companyName
			? client.companyName
			: `${client.title !== "none" ? `${client.title} ` : ""}${client.firstName} ${client.lastName}`
		: "";

	const subtotal = request.lineItems.reduce(
		(sum, item) => sum + item.qty * Number(item.unitPrice),
		0,
	);

	return (
		<div className="max-w-7xl mx-auto">
			{/* Header */}
			<div className="flex items-center justify-between mb-6">
				<div className="flex items-center gap-3">
					<h2 className="text-2xl font-semibold">{request.title}</h2>
					<Badge className={status.className}>{status.label}</Badge>
				</div>
				<div className="flex items-center gap-2">
					<Button variant="outline" size="sm">
						<Mail className="h-4 w-4 mr-1" />
						Email Booking Confirmation
					</Button>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="outline" size="sm">
								<MoreHorizontal className="h-4 w-4 mr-1" />
								More
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuItem>Convert to Job</DropdownMenuItem>
							<DropdownMenuItem>Convert to Quote</DropdownMenuItem>
							<DropdownMenuItem>Archive</DropdownMenuItem>
							<DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</div>

			<div className="grid grid-cols-[1fr_30%] gap-6">
				{/* Left - Main Content */}
				<div className="space-y-5">
					{/* Client Info */}
					<div className="rounded-lg border bg-background px-5 py-4">
						<div className="flex items-start gap-4">
							<div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-sm font-medium shrink-0">
								{clientDisplayName ? getInitials(clientDisplayName) : "?"}
							</div>
							<div className="flex-1 min-w-0 space-y-1.5">
								<p className="font-medium">{clientDisplayName}</p>
								{address && (
									<div className="flex items-start gap-2 text-sm text-muted-foreground">
										<MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0" />
										<span>{address}</span>
									</div>
								)}
								{client?.phones?.[0] && (
									<div className="flex items-center gap-2 text-sm text-muted-foreground">
										<Phone className="h-3.5 w-3.5 shrink-0" />
										<span>{client.phones[0].number}</span>
									</div>
								)}
								{client?.emails?.[0] && (
									<div className="flex items-center gap-2 text-sm text-muted-foreground">
										<Mail className="h-3.5 w-3.5 shrink-0" />
										<span>{client.emails[0].value}</span>
									</div>
								)}
							</div>
						</div>

						{/* Dates */}
						<div className="flex gap-8 mt-4 pt-4 border-t">
							<div>
								<p className="text-xs text-muted-foreground mb-0.5">Requested</p>
								<p className="text-sm font-medium">{formatDate(request.createdAt)}</p>
							</div>
							{request.assessmentStartDate && (
								<div>
									<p className="text-xs text-muted-foreground mb-0.5">Assessment</p>
									<p className="text-sm font-medium">
										{formatAssessmentDate(request.assessmentStartDate, request.assessmentStartTime)}
									</p>
								</div>
							)}
						</div>
					</div>

					{/* Overview - Service Details */}
					<Section title="Overview">
						<div className="space-y-4">
							<div>
								<p className="text-xs text-muted-foreground mb-1">Service details</p>
								<p className="text-xs text-muted-foreground italic mb-2">
									Please provide as much information as you can
								</p>
								<p className="text-sm">{request.serviceDescription}</p>
							</div>

							{request.fileIds.length > 0 && (
								<div>
									<p className="text-xs text-muted-foreground mb-2">Share images of the work to be done</p>
									<div className="flex flex-wrap gap-2">
										{request.fileIds.map((fileId) => (
											<div
												key={fileId}
												className="h-16 w-16 rounded border bg-muted flex items-center justify-center"
											>
												<ImageIcon className="h-5 w-5 text-muted-foreground" />
											</div>
										))}
									</div>
								</div>
							)}

							{client?.leadSource && (
								<div>
									<p className="text-xs text-muted-foreground mb-1">How did you hear about us?</p>
									<p className="text-sm capitalize">{client.leadSource.replace("_", " ")}</p>
								</div>
							)}
						</div>
					</Section>

					{/* On-site Assessment */}
					{(request.assessmentInstructions || request.assessmentStartDate || request.teamReminder !== "none") && (
						<Section title="On-site assessment">
							<div className="space-y-4">
								{request.assessmentInstructions && (
									<div>
										<p className="text-xs text-muted-foreground mb-1">Instructions</p>
										<p className="text-sm">{request.assessmentInstructions}</p>
									</div>
								)}

								{request.assessmentStartDate && (
									<div>
										<div className="flex items-center gap-2 mb-1">
											<Calendar className="h-3.5 w-3.5 text-muted-foreground" />
											<p className="text-xs text-muted-foreground">Schedule</p>
										</div>
										<p className="text-sm">
											{formatAssessmentDate(request.assessmentStartDate, request.assessmentStartTime)}
											{request.assessmentEndTime && (
												<>
													{" – "}
													{(() => {
														const [hours, minutes] = request.assessmentEndTime.split(":");
														const d = new Date();
														d.setHours(Number(hours), Number(minutes));
														return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
													})()}
												</>
											)}
										</p>
									</div>
								)}

								{request.teamReminder !== "none" && (
									<div>
										<div className="flex items-center gap-2 mb-1">
											<Bell className="h-3.5 w-3.5 text-muted-foreground" />
											<p className="text-xs text-muted-foreground">Assessment Reminder</p>
										</div>
										<p className="text-sm">{reminderLabels[request.teamReminder]}</p>
									</div>
								)}
							</div>
						</Section>
					)}

					{/* Line Items */}
					{request.lineItems.length > 0 && (
						<Section title="Product / Service">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead className="text-xs">Line Item</TableHead>
										<TableHead className="text-xs text-right w-20">Quantity</TableHead>
										<TableHead className="text-xs text-right w-24">Unit Price</TableHead>
										<TableHead className="text-xs text-right w-24">Total</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{request.lineItems.map((item) => {
										const total = item.qty * Number(item.unitPrice);
										return (
											<TableRow key={item.id}>
												<TableCell>
													<div className="flex items-center gap-3">
														{item.imageFileId ? (
															<div className="h-9 w-9 rounded bg-muted flex items-center justify-center shrink-0">
																<ImageIcon className="h-4 w-4 text-muted-foreground" />
															</div>
														) : null}
														<div>
															<p className="text-sm font-medium">{item.name}</p>
															{item.description && (
																<p className="text-xs text-muted-foreground">{item.description}</p>
															)}
														</div>
													</div>
												</TableCell>
												<TableCell className="text-sm text-right">{item.qty}</TableCell>
												<TableCell className="text-sm text-right">
													{formatCurrency(Number(item.unitPrice))}
												</TableCell>
												<TableCell className="text-sm text-right font-medium">
													{formatCurrency(total)}
												</TableCell>
											</TableRow>
										);
									})}
								</TableBody>
							</Table>
							<div className="mt-3 pt-3 border-t space-y-1.5">
								<div className="flex justify-between text-sm">
									<span className="text-muted-foreground">Subtotal</span>
									<span>{formatCurrency(subtotal)}</span>
								</div>
								<div className="flex justify-between text-sm font-semibold">
									<span>Total</span>
									<span>{formatCurrency(subtotal)}</span>
								</div>
							</div>
						</Section>
					)}

					{/* Internal Notes */}
					{request.internalNotes && (
						<Section title="Internal Notes">
							<p className="text-sm">{request.internalNotes}</p>
						</Section>
					)}
				</div>

				{/* Right - Notes (30%) */}
				<div className="rounded-lg border bg-background p-4">
					<h3 className="text-base font-semibold mb-3">
						Notes{notes.length > 0 && ` (${notes.length})`}
					</h3>
					{notes.length === 0 ? (
						<p className="text-sm text-muted-foreground py-4">No notes yet</p>
					) : (
						<div className="divide-y">
							{notes.map((note) => (
								<NoteItem key={note.id} note={note} />
							))}
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default RequestDetailPage;
