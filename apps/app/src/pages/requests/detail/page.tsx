import { useState } from "react";
import { useParams } from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getRequestById, updateRequestOverview, updateRequestLineItems, updateRequestAssessment } from "../api";
import { getClientById } from "@/pages/clients/api";
import NotesPanel from "@/components/notes-panel";
import ImageDropzone, { type UploadedFile } from "@/components/image-dropzone";
import LineItemsCard, { type LineItemUI } from "@/components/line-items-card";
import AssessmentCard, { type AssessmentData } from "@/components/assessment-card";
import { formatDate, formatAssessmentDate, formatTimeStr, formatCurrency, getInitials } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
	MoreHorizontal,
	Mail,
	Phone,
	MapPin,
	Calendar,
	Bell,
	ImageIcon,
	Pencil,
} from "lucide-react";


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

// ── Section wrapper ──────────────────────────────────────────────────

function Section({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
	return (
		<div className="rounded-lg border bg-background">
			<div className="px-5 py-3 border-b flex items-center justify-between">
				<h3 className="text-sm font-semibold">{title}</h3>
				{action}
			</div>
			<div className="px-5 py-4">{children}</div>
		</div>
	);
}

// ── Main Page ────────────────────────────────────────────────────────

const RequestDetailPage = () => {
	const { id } = useParams<{ id: string }>();
	const queryClient = useQueryClient();

	const [editingOverview, setEditingOverview] = useState(false);
	const [editDescription, setEditDescription] = useState("");
	const [editImages, setEditImages] = useState<UploadedFile[]>([]);

	const { data: request, isLoading } = useQuery({
		queryKey: ["request", id],
		queryFn: () => getRequestById(id!),
		enabled: !!id,
	});

	const overviewMutation = useMutation({
		mutationFn: (data: { serviceDescription: string; fileIds: string[] }) =>
			updateRequestOverview(id!, data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["request", id] });
			setEditingOverview(false);
		},
	});

	const startEditing = () => {
		if (!request) return;
		setEditDescription(request.serviceDescription);
		setEditImages(
			request.fileIds.map((fileId) => ({ fileId, name: "", preview: "" })),
		);
		setEditingOverview(true);
	};

	const cancelEditing = () => {
		setEditingOverview(false);
	};

	const saveOverview = () => {
		overviewMutation.mutate({
			serviceDescription: editDescription,
			fileIds: editImages.map((f) => f.fileId),
		});
	};

	// Line items editing
	const [editingLineItems, setEditingLineItems] = useState(false);
	const [editLineItems, setEditLineItems] = useState<LineItemUI[]>([]);

	const lineItemsMutation = useMutation({
		mutationFn: (data: { lineItems: { name: string; description?: string; qty: number; unitPrice: number; imageFileId?: string }[] }) =>
			updateRequestLineItems(id!, data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["request", id] });
			setEditingLineItems(false);
		},
	});

	const startEditingLineItems = () => {
		if (!request) return;
		setEditLineItems(
			request.lineItems.map((item) => ({
				name: item.name,
				description: item.description ?? "",
				qty: item.qty,
				unitPrice: Number(item.unitPrice),
				imageFileId: item.imageFileId ?? null,
				imagePreview: null,
				imageUploading: false,
			})),
		);
		setEditingLineItems(true);
	};

	const saveLineItems = () => {
		lineItemsMutation.mutate({
			lineItems: editLineItems.map((item) => ({
				name: item.name,
				description: item.description || undefined,
				qty: item.qty,
				unitPrice: item.unitPrice,
				imageFileId: item.imageFileId || undefined,
			})),
		});
	};

	// Assessment editing
	const [editingAssessment, setEditingAssessment] = useState(false);
	const [editAssessment, setEditAssessment] = useState<AssessmentData>({
		assessmentInstructions: "",
		assessmentStartDate: "",
		assessmentEndDate: "",
		assessmentStartTime: "",
		assessmentEndTime: "",
		scheduleLater: false,
		anytime: false,
		teamReminder: "none",
	});

	const assessmentMutation = useMutation({
		mutationFn: (data: AssessmentData) => updateRequestAssessment(id!, data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["request", id] });
			setEditingAssessment(false);
		},
	});

	const startEditingAssessment = () => {
		if (!request) return;
		setEditAssessment({
			assessmentInstructions: request.assessmentInstructions ?? "",
			assessmentStartDate: request.assessmentStartDate ?? "",
			assessmentEndDate: request.assessmentEndDate ?? "",
			assessmentStartTime: request.assessmentStartTime ?? "",
			assessmentEndTime: request.assessmentEndTime ?? "",
			scheduleLater: request.scheduleLater ?? false,
			anytime: request.anytime ?? false,
			teamReminder: request.teamReminder ?? "none",
		});
		setEditingAssessment(true);
	};

	const { data: client } = useQuery({
		queryKey: ["client", request?.clientId],
		queryFn: () => getClientById(request!.clientId),
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
					<Section
						title="Overview"
						action={
							!editingOverview && (
								<Button variant="ghost" size="sm" className="h-7 text-xs" onClick={startEditing}>
									<Pencil className="h-3 w-3 mr-1" />
									Edit
								</Button>
							)
						}
					>
						{editingOverview ? (
							<div className="space-y-4">
								<div className="space-y-2">
									<p className="text-xs text-muted-foreground">Service details</p>
									<Textarea
										rows={4}
										value={editDescription}
										onChange={(e) => setEditDescription(e.target.value)}
										placeholder="Describe the service needed..."
									/>
								</div>

								<ImageDropzone images={editImages} onChange={setEditImages} />

								<div className="flex items-center gap-2 pt-2">
									<Button
										size="sm"
										onClick={saveOverview}
										disabled={overviewMutation.isPending || !editDescription.trim()}
									>
										{overviewMutation.isPending ? "Saving..." : "Save"}
									</Button>
									<Button variant="outline" size="sm" onClick={cancelEditing}>
										Cancel
									</Button>
								</div>
							</div>
						) : (
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
						)}
					</Section>

					{/* On-site Assessment */}
					{editingAssessment ? (
						<AssessmentCard
							value={editAssessment}
							onChange={setEditAssessment}
							onSave={() => assessmentMutation.mutate(editAssessment)}
							onCancel={() => setEditingAssessment(false)}
							saving={assessmentMutation.isPending}
						/>
					) : (request.assessmentInstructions || request.assessmentStartDate || request.teamReminder !== "none") ? (
						<Section
							title="On-site assessment"
							action={
								<Button variant="ghost" size="sm" className="h-7 text-xs" onClick={startEditingAssessment}>
									<Pencil className="h-3 w-3 mr-1" />
									Edit
								</Button>
							}
						>
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
													{formatTimeStr(request.assessmentEndTime)}
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
					) : (
						<Section
							title="On-site assessment"
							action={
								<Button variant="ghost" size="sm" className="h-7 text-xs" onClick={startEditingAssessment}>
									<Pencil className="h-3 w-3 mr-1" />
									Edit
								</Button>
							}
						>
							<p className="text-sm text-muted-foreground">No assessment details</p>
						</Section>
					)}

					{/* Line Items */}
					{editingLineItems ? (
						<LineItemsCard
							items={editLineItems}
							onChange={setEditLineItems}
							onSave={saveLineItems}
							onCancel={() => setEditingLineItems(false)}
							saving={lineItemsMutation.isPending}
						/>
					) : request.lineItems.length > 0 ? (
						<Section
							title="Product / Service"
							action={
								<Button variant="ghost" size="sm" className="h-7 text-xs" onClick={startEditingLineItems}>
									<Pencil className="h-3 w-3 mr-1" />
									Edit
								</Button>
							}
						>
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
					) : (
						<Section
							title="Product / Service"
							action={
								<Button variant="ghost" size="sm" className="h-7 text-xs" onClick={startEditingLineItems}>
									<Pencil className="h-3 w-3 mr-1" />
									Edit
								</Button>
							}
						>
							<p className="text-sm text-muted-foreground">No line items</p>
						</Section>
					)}

				</div>

				{/* Right - Notes (30%) */}
				<div className="sticky top-[4.5rem] h-[calc(100vh-5.5rem)]">
					<NotesPanel clientId={request.clientId} className="h-full" />
				</div>
			</div>
		</div>
	);
};

export default RequestDetailPage;
