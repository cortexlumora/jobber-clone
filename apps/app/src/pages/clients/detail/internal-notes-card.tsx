import { useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
	getClientNotes,
	createClientNote,
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
import { FileText, Paperclip, Trash2 } from "lucide-react";

interface InternalNotesCardProps {
	clientId: string;
}

const InternalNotesCard = ({ clientId }: InternalNotesCardProps) => {
	const queryClient = useQueryClient();

	const { data: notes = [] } = useQuery({
		queryKey: ["client-notes", clientId],
		queryFn: () => getClientNotes(clientId),
	});

	const [noteContent, setNoteContent] = useState("");
	const [noteFiles, setNoteFiles] = useState<File[]>([]);
	const [noteRelated, setNoteRelated] = useState({
		relatedToRequests: false,
		relatedToQuotes: false,
		relatedToJobs: false,
		relatedToInvoices: false,
	});
	const [isSavingNote, setIsSavingNote] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const createNoteMutation = useMutation({
		mutationFn: createClientNote,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["client-notes", clientId] });
			setNoteContent("");
			setNoteFiles([]);
			setNoteRelated({ relatedToRequests: false, relatedToQuotes: false, relatedToJobs: false, relatedToInvoices: false });
		},
	});

	const deleteNoteMutation = useMutation({
		mutationFn: (noteId: string) => deleteClientNote(clientId, noteId),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["client-notes", clientId] });
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
					<input
						ref={fileInputRef}
						type="file"
						multiple
						className="hidden"
						onChange={handleNoteFileSelect}
					/>
					<p className="text-sm text-muted-foreground">
						Drag your files here or{" "}
						<Button
							variant="link"
							className="p-0 h-auto text-sm"
							onClick={() => fileInputRef.current?.click()}
						>
							Select a File
						</Button>
					</p>
				</div>
				{noteFiles.length > 0 && (
					<div className="flex flex-wrap gap-2">
						{noteFiles.map((file, i) => (
							<div key={i} className="flex items-center gap-1.5 rounded border px-2 py-1 text-xs text-muted-foreground">
								<span className="max-w-[120px] truncate">{file.name}</span>
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
						{([
							["relatedToRequests", "Requests"],
							["relatedToQuotes", "Quotes"],
							["relatedToJobs", "Jobs"],
							["relatedToInvoices", "Invoices"],
						] as const).map(([key, label]) => (
							<label key={key} className="flex items-center gap-1.5 text-sm cursor-pointer">
								<Checkbox
									checked={noteRelated[key]}
									onCheckedChange={(checked) =>
										setNoteRelated((prev) => ({ ...prev, [key]: !!checked }))
									}
								/>
								{label}
							</label>
						))}
					</div>
				</div>
				<div className="flex justify-end">
					<Button
						size="sm"
						onClick={handleSaveNote}
						disabled={!noteContent.trim() || isSavingNote}
					>
						{isSavingNote ? "Saving..." : "Save Note"}
					</Button>
				</div>

				{/* Existing notes (newest first) */}
				{notes.length > 0 && (
					<div className="space-y-3 pt-3 border-t">
						{notes.map((note) => (
							<div key={note.id} className="rounded-md border p-3 space-y-2">
								<div className="flex items-start justify-between">
									<div className="flex items-center gap-2">
										<Avatar size="sm">
											{note.createdByAvatar && <AvatarImage src={note.createdByAvatar} alt={note.createdByName} />}
											<AvatarFallback>
												{note.createdByName
													.split(" ")
													.map((n) => n[0])
													.join("")
													.slice(0, 2)
													.toUpperCase()}
											</AvatarFallback>
										</Avatar>
										<div>
											<p className="text-xs font-medium leading-none">{note.createdByName}</p>
											<p className="text-[11px] text-muted-foreground">
												{new Date(note.createdAt).toLocaleDateString("en-US", {
													month: "short",
													day: "numeric",
													year: "numeric",
												})}{" "}
												{new Date(note.createdAt).toLocaleTimeString("en-US", {
													hour: "numeric",
													minute: "2-digit",
												})}
											</p>
										</div>
									</div>
									<Button
										variant="ghost"
										size="sm"
										className="h-5 w-5 p-0 text-muted-foreground hover:text-destructive"
										onClick={() => deleteNoteMutation.mutate(note.id)}
									>
										<Trash2 className="h-3 w-3" />
									</Button>
								</div>
								<p className="text-sm">{note.content}</p>
								{(note.relatedToRequests || note.relatedToQuotes || note.relatedToJobs || note.relatedToInvoices) && (
									<div className="flex flex-wrap gap-1 pt-1">
										{note.relatedToRequests && <Badge variant="outline" className="text-[10px] px-1.5 py-0">Requests</Badge>}
										{note.relatedToQuotes && <Badge variant="outline" className="text-[10px] px-1.5 py-0">Quotes</Badge>}
										{note.relatedToJobs && <Badge variant="outline" className="text-[10px] px-1.5 py-0">Jobs</Badge>}
										{note.relatedToInvoices && <Badge variant="outline" className="text-[10px] px-1.5 py-0">Invoices</Badge>}
									</div>
								)}
								{note.files.length > 0 && (
									<div className="flex flex-wrap gap-2 pt-1">
										{note.files.map((file) => {
											const isImage = file.contentType.startsWith("image/");
											return (
												<a
													key={file.id}
													href={file.url}
													target="_blank"
													rel="noopener noreferrer"
													className="block rounded border overflow-hidden hover:ring-2 hover:ring-primary/50"
												>
													{isImage ? (
														<img
															src={file.url}
															alt={file.name}
															className="h-16 w-16 object-cover"
														/>
													) : (
														<div className="h-16 w-16 flex flex-col items-center justify-center gap-1 bg-muted">
															<FileText className="h-5 w-5 text-muted-foreground" />
															<span className="text-[9px] text-muted-foreground max-w-14 truncate px-1">
																{file.name.split(".").pop()?.toUpperCase()}
															</span>
														</div>
													)}
												</a>
											);
										})}
									</div>
								)}
							</div>
						))}
					</div>
				)}
			</CardContent>
		</Card>
	);
};

export default InternalNotesCard;
