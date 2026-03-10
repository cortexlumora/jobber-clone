import { useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ClientNoteDTO, ClientNoteFileDTO } from "@repo/dto";
import {
	getClientNotes,
	createClientNote,
	updateClientNote,
	deleteClientNote,
	presignUpload,
	uploadFileToS3,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FileText, Trash2, X } from "lucide-react";

const RELATED_KEYS = [
	["relatedToRequests", "Requests"],
	["relatedToQuotes", "Quotes"],
	["relatedToJobs", "Jobs"],
	["relatedToInvoices", "Invoices"],
] as const;

type RelatedState = {
	relatedToRequests: boolean;
	relatedToQuotes: boolean;
	relatedToJobs: boolean;
	relatedToInvoices: boolean;
};

const defaultRelated: RelatedState = {
	relatedToRequests: false,
	relatedToQuotes: false,
	relatedToJobs: false,
	relatedToInvoices: false,
};

function getInitials(name: string) {
	return name
		.split(" ")
		.map((n) => n[0])
		.join("")
		.slice(0, 2)
		.toUpperCase();
}

function getRelatedLabel(note: ClientNoteDTO) {
	const linked = RELATED_KEYS.filter(([key]) => note[key]).map(([, label]) => label.toLowerCase());
	if (linked.length === 0) return null;
	return `Client note linked to related ${linked.join(", ")}`;
}

function formatDate(date: Date | string) {
	const d = new Date(date);
	return `${d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} ${d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;
}

// ── Collapsed Note ──────────────────────────────────────────────────
interface CollapsedNoteProps {
	note: ClientNoteDTO;
	onClick: () => void;
}

const CollapsedNote = ({ note, onClick }: CollapsedNoteProps) => {
	const isEdited = new Date(note.updatedAt).getTime() - new Date(note.createdAt).getTime() > 1000;
	const relatedLabel = getRelatedLabel(note);

	return (
		<div
			className="rounded-md border p-3 space-y-1.5 cursor-pointer hover:bg-muted/50 transition-colors"
			onClick={onClick}
		>
			<div className="flex items-center gap-2">
				<Avatar size="sm">
					{note.createdByAvatar && <AvatarImage src={note.createdByAvatar} alt={note.createdByName} />}
					<AvatarFallback>{getInitials(note.createdByName)}</AvatarFallback>
				</Avatar>
				<div>
					<p className="text-xs font-medium leading-none">{note.createdByName}</p>
					<p className="text-[11px] text-muted-foreground">
						Created: {formatDate(note.createdAt)}
						{isEdited && " · Edited"}
					</p>
				</div>
			</div>
			<p className="text-sm">{note.content}</p>
			{relatedLabel && (
				<p className="text-[11px] text-muted-foreground italic">{relatedLabel}</p>
			)}
		</div>
	);
};

// ── Edit Note ───────────────────────────────────────────────────────
interface EditNoteProps {
	note: ClientNoteDTO;
	clientId: string;
	onClose: () => void;
}

const EditNote = ({ note, clientId, onClose }: EditNoteProps) => {
	const queryClient = useQueryClient();
	const [content, setContent] = useState(note.content);
	const [existingFiles, setExistingFiles] = useState<ClientNoteFileDTO[]>(note.files);
	const [newFiles, setNewFiles] = useState<File[]>([]);
	const [related, setRelated] = useState<RelatedState>({
		relatedToRequests: note.relatedToRequests,
		relatedToQuotes: note.relatedToQuotes,
		relatedToJobs: note.relatedToJobs,
		relatedToInvoices: note.relatedToInvoices,
	});
	const [isSaving, setIsSaving] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const updateMutation = useMutation({
		mutationFn: (data: Parameters<typeof updateClientNote>[2]) =>
			updateClientNote(clientId, note.id, data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["client-notes", clientId] });
			onClose();
		},
	});

	const deleteMutation = useMutation({
		mutationFn: () => deleteClientNote(clientId, note.id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["client-notes", clientId] });
			onClose();
		},
	});

	const handleSave = async () => {
		if (!content.trim()) return;
		setIsSaving(true);
		try {
			const uploadedFileIds: string[] = [];
			for (const file of newFiles) {
				const { uploadUrl, fileId } = await presignUpload(file.name, file.type);
				await uploadFileToS3(uploadUrl, file);
				uploadedFileIds.push(fileId);
			}
			const allFileIds = [...existingFiles.map((f) => f.id), ...uploadedFileIds];
			updateMutation.mutate({ content: content.trim(), fileIds: allFileIds, ...related });
		} finally {
			setIsSaving(false);
		}
	};

	const handleFileDrop = (e: React.DragEvent) => {
		e.preventDefault();
		const files = Array.from(e.dataTransfer.files);
		if (files.length > 0) setNewFiles((prev) => [...prev, ...files]);
	};

	const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = Array.from(e.target.files ?? []);
		if (files.length > 0) setNewFiles((prev) => [...prev, ...files]);
		e.target.value = "";
	};

	const isEdited = new Date(note.updatedAt).getTime() - new Date(note.createdAt).getTime() > 1000;

	return (
		<div className="rounded-md border p-3 space-y-3">
			{/* Header */}
			<div className="flex items-center gap-2">
				<Avatar size="sm">
					{note.createdByAvatar && <AvatarImage src={note.createdByAvatar} alt={note.createdByName} />}
					<AvatarFallback>{getInitials(note.createdByName)}</AvatarFallback>
				</Avatar>
				<div>
					<p className="text-xs font-medium leading-none">{note.createdByName}</p>
					<p className="text-[11px] text-muted-foreground">
						Created: {formatDate(note.createdAt)}
						{isEdited && " · Edited"}
					</p>
				</div>
			</div>

			{/* Content */}
			<Textarea
				value={content}
				onChange={(e) => setContent(e.target.value)}
				rows={3}
				placeholder="Note details"
			/>

			{/* Existing files */}
			{existingFiles.length > 0 && (
				<div className="flex flex-wrap gap-2">
					{existingFiles.map((file) => {
						const isImage = file.contentType.startsWith("image/");
						return (
							<div key={file.id} className="relative group">
								<a
									href={file.url}
									target="_blank"
									rel="noopener noreferrer"
									className="block rounded border overflow-hidden"
								>
									{isImage ? (
										<img src={file.url} alt={file.name} className="h-16 w-16 object-cover" />
									) : (
										<div className="h-16 w-16 flex flex-col items-center justify-center gap-1 bg-muted">
											<FileText className="h-5 w-5 text-muted-foreground" />
											<span className="text-[9px] text-muted-foreground max-w-14 truncate px-1">
												{file.name.split(".").pop()?.toUpperCase()}
											</span>
										</div>
									)}
								</a>
								<button
									type="button"
									className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
									onClick={() => setExistingFiles((prev) => prev.filter((f) => f.id !== file.id))}
								>
									<X className="h-2.5 w-2.5" />
								</button>
								<p className="text-[9px] text-muted-foreground max-w-16 truncate mt-0.5">{file.name}</p>
							</div>
						);
					})}
				</div>
			)}

			{/* New files pending upload */}
			{newFiles.length > 0 && (
				<div className="flex flex-wrap gap-2">
					{newFiles.map((file, i) => (
						<div key={i} className="flex items-center gap-1.5 rounded border px-2 py-1 text-xs text-muted-foreground">
							<span className="max-w-30 truncate">{file.name}</span>
							<button
								type="button"
								className="hover:text-destructive"
								onClick={() => setNewFiles((prev) => prev.filter((_, idx) => idx !== i))}
							>
								&times;
							</button>
						</div>
					))}
				</div>
			)}

			{/* Drop zone */}
			<div
				className="rounded-lg border border-dashed p-4 text-center"
				onDragOver={(e) => e.preventDefault()}
				onDrop={handleFileDrop}
			>
				<input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileSelect} />
				<p className="text-sm text-muted-foreground">
					Drag your files here or{" "}
					<Button variant="link" className="p-0 h-auto text-sm" onClick={() => fileInputRef.current?.click()}>
						Select a File
					</Button>
				</p>
			</div>

			{/* Related checkboxes */}
			<div>
				<p className="text-xs font-medium mb-2">Link note to related</p>
				<div className="flex flex-wrap gap-3">
					{RELATED_KEYS.map(([key, label]) => (
						<label key={key} className="flex items-center gap-1.5 text-sm cursor-pointer">
							<Checkbox
								checked={related[key]}
								onCheckedChange={(checked) => setRelated((prev) => ({ ...prev, [key]: !!checked }))}
							/>
							{label}
						</label>
					))}
				</div>
			</div>

			{/* Actions */}
			<div className="flex items-center justify-between">
				<Button
					variant="destructive"
					size="sm"
					onClick={() => deleteMutation.mutate()}
					disabled={deleteMutation.isPending}
				>
					{deleteMutation.isPending ? "Deleting..." : "Delete"}
				</Button>
				<div className="flex items-center gap-2">
					<Button variant="outline" size="sm" onClick={onClose}>
						Cancel
					</Button>
					<Button size="sm" onClick={handleSave} disabled={!content.trim() || isSaving}>
						{isSaving ? "Saving..." : "Save"}
					</Button>
				</div>
			</div>
		</div>
	);
};

// ── Main Card ───────────────────────────────────────────────────────
interface InternalNotesCardProps {
	clientId: string;
}

const InternalNotesCard = ({ clientId }: InternalNotesCardProps) => {
	const queryClient = useQueryClient();
	const [editingNoteId, setEditingNoteId] = useState<string | null>(null);

	const { data: notes = [] } = useQuery({
		queryKey: ["client-notes", clientId],
		queryFn: () => getClientNotes(clientId),
	});

	// Create note state
	const [noteContent, setNoteContent] = useState("");
	const [noteFiles, setNoteFiles] = useState<File[]>([]);
	const [noteRelated, setNoteRelated] = useState<RelatedState>({ ...defaultRelated });
	const [isSavingNote, setIsSavingNote] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const createNoteMutation = useMutation({
		mutationFn: createClientNote,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["client-notes", clientId] });
			setNoteContent("");
			setNoteFiles([]);
			setNoteRelated({ ...defaultRelated });
		},
	});

	const handleSaveNote = async () => {
		if (!noteContent.trim()) return;
		setIsSavingNote(true);
		try {
			const fileIds: string[] = [];
			for (const file of noteFiles) {
				const { uploadUrl, fileId } = await presignUpload(file.name, file.type);
				await uploadFileToS3(uploadUrl, file);
				fileIds.push(fileId);
			}
			createNoteMutation.mutate({ clientId, content: noteContent.trim(), fileIds, ...noteRelated });
		} finally {
			setIsSavingNote(false);
		}
	};

	const handleNoteFileDrop = (e: React.DragEvent) => {
		e.preventDefault();
		const files = Array.from(e.dataTransfer.files);
		if (files.length > 0) setNoteFiles((prev) => [...prev, ...files]);
	};

	const handleNoteFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = Array.from(e.target.files ?? []);
		if (files.length > 0) setNoteFiles((prev) => [...prev, ...files]);
		e.target.value = "";
	};

	return (
		<Card>
			<CardHeader className="pb-3">
				<CardTitle className="text-sm font-semibold">Internal notes</CardTitle>
				<p className="text-xs text-muted-foreground">
					Internal notes will only be seen by your team
				</p>
			</CardHeader>
			<CardContent className="space-y-3">
				{/* Add note form */}
				<Textarea
					placeholder="Note details"
					rows={3}
					value={noteContent}
					onChange={(e) => setNoteContent(e.target.value)}
				/>
				<div
					className="rounded-lg border border-dashed p-4 text-center"
					onDragOver={(e) => e.preventDefault()}
					onDrop={handleNoteFileDrop}
				>
					<input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleNoteFileSelect} />
					<p className="text-sm text-muted-foreground">
						Drag your files here or{" "}
						<Button variant="link" className="p-0 h-auto text-sm" onClick={() => fileInputRef.current?.click()}>
							Select a File
						</Button>
					</p>
				</div>
				{noteFiles.length > 0 && (
					<div className="flex flex-wrap gap-2">
						{noteFiles.map((file, i) => (
							<div key={i} className="flex items-center gap-1.5 rounded border px-2 py-1 text-xs text-muted-foreground">
								<span className="max-w-30 truncate">{file.name}</span>
								<button
									type="button"
									className="hover:text-destructive"
									onClick={() => setNoteFiles((prev) => prev.filter((_, idx) => idx !== i))}
								>
									&times;
								</button>
							</div>
						))}
					</div>
				)}
				<div>
					<p className="text-xs font-medium mb-2">Link note to related</p>
					<div className="flex flex-wrap gap-3">
						{RELATED_KEYS.map(([key, label]) => (
							<label key={key} className="flex items-center gap-1.5 text-sm cursor-pointer">
								<Checkbox
									checked={noteRelated[key]}
									onCheckedChange={(checked) => setNoteRelated((prev) => ({ ...prev, [key]: !!checked }))}
								/>
								{label}
							</label>
						))}
					</div>
				</div>
				<div className="flex justify-end">
					<Button size="sm" onClick={handleSaveNote} disabled={!noteContent.trim() || isSavingNote}>
						{isSavingNote ? "Saving..." : "Save Note"}
					</Button>
				</div>

				{/* Existing notes */}
				{notes.length > 0 && (
					<div className="space-y-3 pt-3 border-t">
						{notes.map((note) =>
							editingNoteId === note.id ? (
								<EditNote
									key={note.id}
									note={note}
									clientId={clientId}
									onClose={() => setEditingNoteId(null)}
								/>
							) : (
								<CollapsedNote
									key={note.id}
									note={note}
									onClick={() => setEditingNoteId(note.id)}
								/>
							),
						)}
					</div>
				)}
			</CardContent>
		</Card>
	);
};

export default InternalNotesCard;
