// temp file

import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import type { ClientNoteFileDTO } from "@repo/dto";
import { FileText, X } from "lucide-react";

const RELATED_KEYS = [
	["relatedToRequests", "Requests"],
	["relatedToQuotes", "Quotes"],
	["relatedToJobs", "Jobs"],
	["relatedToInvoices", "Invoices"],
] as const;

export type RelatedState = {
	relatedToRequests: boolean;
	relatedToQuotes: boolean;
	relatedToJobs: boolean;
	relatedToInvoices: boolean;
};

interface NoteComposerProps {
	content: string;
	onContentChange: (content: string) => void;
	existingFiles?: ClientNoteFileDTO[];
	onRemoveExistingFile?: (fileId: string) => void;
	newFiles: File[];
	onNewFilesChange: (files: File[]) => void;
	related: RelatedState;
	onRelatedChange: (related: RelatedState) => void;
	onSave: () => void;
	saving?: boolean;
	saveLabel?: string;
	onCancel?: () => void;
	onDelete?: () => void;
	deleting?: boolean;
}

const NoteComposer = ({
	content,
	onContentChange,
	existingFiles,
	onRemoveExistingFile,
	newFiles,
	onNewFilesChange,
	related,
	onRelatedChange,
	onSave,
	saving,
	saveLabel = "Save Note",
	onCancel,
	onDelete,
	deleting,
}: NoteComposerProps) => {
	const fileInputRef = useRef<HTMLInputElement>(null);

	const handleFileDrop = (e: React.DragEvent) => {
		e.preventDefault();
		const files = Array.from(e.dataTransfer.files);
		if (files.length > 0) onNewFilesChange([...newFiles, ...files]);
	};

	const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = Array.from(e.target.files ?? []);
		if (files.length > 0) onNewFilesChange([...newFiles, ...files]);
		e.target.value = "";
	};

	return (
		<div className="space-y-3">
			<Textarea
				placeholder="Note details"
				rows={3}
				value={content}
				onChange={(e) => onContentChange(e.target.value)}
			/>

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

			{/* Existing files */}
			{existingFiles && existingFiles.length > 0 && (
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
								{onRemoveExistingFile && (
									<button
										type="button"
										className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
										onClick={() => onRemoveExistingFile(file.id)}
									>
										<X className="h-2.5 w-2.5" />
									</button>
								)}
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
								onClick={() => onNewFilesChange(newFiles.filter((_, idx) => idx !== i))}
							>
								&times;
							</button>
						</div>
					))}
				</div>
			)}

			{/* Related checkboxes */}
			<div>
				<p className="text-xs font-medium mb-2">Link note to related</p>
				<div className="flex flex-wrap gap-3">
					{RELATED_KEYS.map(([key, label]) => (
						<label key={key} className="flex items-center gap-1.5 text-sm cursor-pointer">
							<Checkbox
								checked={related[key]}
								onCheckedChange={(checked) => onRelatedChange({ ...related, [key]: !!checked })}
							/>
							{label}
						</label>
					))}
				</div>
			</div>

			{/* Actions */}
			<div className="flex items-center justify-between">
				<div>
					{onDelete && (
						<Button variant="destructive" size="sm" onClick={onDelete} disabled={deleting}>
							{deleting ? "Deleting..." : "Delete"}
						</Button>
					)}
				</div>
				<div className="flex items-center gap-2">
					{onCancel && (
						<Button variant="outline" size="sm" onClick={onCancel}>
							Cancel
						</Button>
					)}
					<Button size="sm" onClick={onSave} disabled={!content.trim() || saving}>
						{saving ? "Saving..." : saveLabel}
					</Button>
				</div>
			</div>
		</div>
	);
};

export default NoteComposer;
