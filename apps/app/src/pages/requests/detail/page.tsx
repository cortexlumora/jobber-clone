import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getRequestNotes, updateRequestOverview, updateRequestLineItems, updateRequestAssessment } from "../api";
import { useRequestQuery } from "../hooks";
import NotesPanel from "@/components/notes-panel";
import Section from "@/components/section";
import ImageDropzone, { type UploadedFile } from "@/components/image-dropzone";
import LineItemsCard, { type LineItemUI } from "@/components/line-items-card";
import LineItemsView from "@/components/line-items-view";
import AssessmentCard, { type AssessmentData } from "@/components/assessment-card";
import { formatDate, formatAssessmentDate, formatTimeStr, getInitials } from "@/lib/format";
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
	MoreHorizontal,
	Mail,
	Phone,
	Calendar,
	Bell,
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


// ── Main Page ────────────────────────────────────────────────────────

const RequestDetailPage = () => {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const queryClient = useQueryClient();

	const [editingOverview, setEditingOverview] = useState(false);
	const [editDescription, setEditDescription] = useState("");
	const [editImages, setEditImages] = useState<UploadedFile[]>([]);

	const { data: request, isLoading } = useRequestQuery(id);

	// Seed notes cache from request data
	if (request?.clientNotes) {
		queryClient.setQueryData(["request-notes", id], (old: unknown) => old ?? { pages: [request.clientNotes], pageParams: [1] });
	}

	const { data: notesData, hasNextPage, fetchNextPage, isFetchingNextPage } = useInfiniteQuery({
		queryKey: ["request-notes", id],
		queryFn: ({ pageParam }) => getRequestNotes(id!, pageParam),
		initialPageParam: 1,
		getNextPageParam: (last) => last.pagination.page < last.pagination.totalPages ? last.pagination.page + 1 : undefined,
		enabled: !!request,
		staleTime: 30_000,
	});

	const allNotes = notesData?.pages.flatMap((p) => p.data) ?? [];
	const notesTotal = notesData?.pages[0]?.pagination.total;

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
			request.attachments.map((f) => ({ fileId: f.id, name: f.name, preview: f.url })),
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
				imageFileId: item.image?.id ?? null,
				imagePreview: item.image?.url ?? null,
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
		instructions: "",
		startDate: "",
		endDate: "",
		startTime: "",
		endTime: "",
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
			instructions: request.assessment?.instructions ?? "",
			startDate: request.assessment?.startDate ?? "",
			endDate: request.assessment?.endDate ?? "",
			startTime: request.assessment?.startTime ?? "",
			endTime: request.assessment?.endTime ?? "",
			scheduleLater: request.assessment?.scheduleLater ?? false,
			anytime: request.assessment?.anytime ?? false,
			teamReminder: request.assessment?.teamReminder ?? "none",
		});
		setEditingAssessment(true);
	};

	if (isLoading) {
		return <p className="text-muted-foreground p-4">Loading...</p>;
	}

	if (!request) {
		return <p className="text-muted-foreground p-4">Request not found</p>;
	}

	const client = request.client;
	const status = statusConfig[request.status] ?? statusConfig.new;

	const clientDisplayName = client
		? client.useCompanyAsPrimary && client.companyName
			? client.companyName
			: `${client.title !== "none" ? `${client.title} ` : ""}${client.firstName} ${client.lastName}`
		: "";

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
							<DropdownMenuItem onClick={() => navigate(`/quotes/create?requestId=${id}`)}>Convert to Quote</DropdownMenuItem>
							<DropdownMenuItem onClick={() => navigate(`/jobs/create?requestId=${id}`)}>Convert to Job</DropdownMenuItem>
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
							{request.assessment?.startDate && (
								<div>
									<p className="text-xs text-muted-foreground mb-0.5">Assessment</p>
									<p className="text-sm font-medium">
										{formatAssessmentDate(request.assessment?.startDate, request.assessment?.startTime)}
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

								{request.attachments.length > 0 && (
									<div>
										<p className="text-xs text-muted-foreground mb-2">Share images of the work to be done</p>
										<div className="flex flex-wrap gap-2">
											{request.attachments.map((file) => (
												<img
													key={file.id}
													src={file.url}
													alt={file.name}
													className="h-16 w-16 rounded border object-cover"
												/>
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
						<Section title="On-site assessment">
							<AssessmentCard
								value={editAssessment}
								onChange={setEditAssessment}
								onSave={() => assessmentMutation.mutate(editAssessment)}
								onCancel={() => setEditingAssessment(false)}
								saving={assessmentMutation.isPending}
								hideHeader
							/>
						</Section>
					) : (request.assessment?.instructions || request.assessment?.startDate || request.assessment?.teamReminder !== "none") ? (
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
								{request.assessment?.instructions && (
									<div>
										<p className="text-xs text-muted-foreground mb-1">Instructions</p>
										<p className="text-sm">{request.assessment?.instructions}</p>
									</div>
								)}

								{request.assessment?.startDate && (
									<div>
										<div className="flex items-center gap-2 mb-1">
											<Calendar className="h-3.5 w-3.5 text-muted-foreground" />
											<p className="text-xs text-muted-foreground">Schedule</p>
										</div>
										<p className="text-sm">
											{formatAssessmentDate(request.assessment?.startDate, request.assessment?.startTime)}
											{request.assessment?.endTime && (
												<>
													{" – "}
													{formatTimeStr(request.assessment?.endTime)}
												</>
											)}
										</p>
									</div>
								)}

								{request.assessment?.teamReminder !== "none" && (
									<div>
										<div className="flex items-center gap-2 mb-1">
											<Bell className="h-3.5 w-3.5 text-muted-foreground" />
											<p className="text-xs text-muted-foreground">Assessment Reminder</p>
										</div>
										<p className="text-sm">{reminderLabels[request.assessment?.teamReminder]}</p>
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
						<Section title="Product / Service">
							<LineItemsCard
								items={editLineItems}
								onChange={setEditLineItems}
								onSave={saveLineItems}
								onCancel={() => setEditingLineItems(false)}
								saving={lineItemsMutation.isPending}
								hideHeader
							/>
						</Section>
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
							<LineItemsView items={request.lineItems} />
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
					<NotesPanel notes={allNotes} total={notesTotal} hasMore={hasNextPage} onLoadMore={fetchNextPage} isLoadingMore={isFetchingNextPage} className="h-full" />
				</div>
			</div>
		</div>
	);
};

export default RequestDetailPage;
