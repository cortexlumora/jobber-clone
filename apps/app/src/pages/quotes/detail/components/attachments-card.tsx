import { useState } from "react";
import { useDropzone } from "react-dropzone";
import { presignUpload, uploadFileToS3 } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Paperclip, X, Loader2, FileIcon, Pencil, Trash2 } from "lucide-react";

export interface AttachmentFile {
	fileId: string;
	name: string;
}

interface AttachmentsCardProps {
	isEdit: boolean;
	isDirty: boolean;
	onEdit: () => void;
	onCancelEdit: () => void;
	onSave: () => void;
	onRemoveSection: () => void;
	files: AttachmentFile[];
	onAdd: (files: AttachmentFile[]) => void;
	onRemoveFile: (fileId: string) => void;
	saving?: boolean;
}

const AttachmentsCard = ({ isEdit, isDirty, onEdit, onCancelEdit, onSave, onRemoveSection, files, onAdd, onRemoveFile, saving }: AttachmentsCardProps) => {
	const [uploading, setUploading] = useState(false);

	const dropzone = useDropzone({
		disabled: !isEdit,
		onDrop: async (acceptedFiles) => {
			setUploading(true);
			try {
				const results = await Promise.all(
					acceptedFiles.map(async (file) => {
						const { fileId, uploadUrl } = await presignUpload(file.name, file.type);
						await uploadFileToS3(uploadUrl, file);
						return { fileId, name: file.name };
					}),
				);
				onAdd(results);
			} catch (err) {
				console.error("File upload failed:", err);
			} finally {
				setUploading(false);
			}
		},
	});

	return (
		<div className="rounded-xl px-2 border bg-background">
			<div className="py-4 px-2 flex items-center justify-between">
				<h3 className="text-lg font-medium">Attachments</h3>
				{isEdit ? (
					<Button type="button" variant="ghost" size="sm" className="h-7 text-xs text-destructive" onClick={onRemoveSection} disabled={saving}>
						<Trash2 className="h-3 w-3 mr-1" />
						Delete
					</Button>
				) : (
					<Button type="button" variant="ghost" size="sm" className="h-7 text-xs" onClick={onEdit}>
						<Pencil className="h-3 w-3 mr-1" />
						Edit
					</Button>
				)}
			</div>
			<div className="px-2 pb-4">
				{isEdit ? (
					<div className="space-y-3">
						{files.length > 0 && (
							<div className="space-y-2">
								{files.map((file) => (
									<div key={file.fileId} className="flex items-center justify-between rounded-lg border px-3 py-2">
										<div className="flex items-center gap-2 min-w-0">
											<FileIcon className="h-4 w-4 text-muted-foreground shrink-0" />
											<span className="text-sm truncate">{file.name}</span>
										</div>
										<Button
											type="button"
											variant="ghost"
											size="icon"
											className="h-6 w-6 shrink-0"
											onClick={() => onRemoveFile(file.fileId)}
											disabled={saving}
										>
											<X className="h-3 w-3" />
										</Button>
									</div>
								))}
							</div>
						)}
						<div
							{...dropzone.getRootProps()}
							className={`h-32 w-full rounded-lg border border-dashed bg-muted/30 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-muted/50 transition-colors ${
								dropzone.isDragActive ? "border-primary bg-primary/5" : ""
							}`}
						>
							<input {...dropzone.getInputProps()} />
							{uploading ? (
								<>
									<Loader2 className="h-6 w-6 text-muted-foreground animate-spin" />
									<p className="text-sm text-muted-foreground">Uploading...</p>
								</>
							) : (
								<>
									<Paperclip className="h-6 w-6 text-muted-foreground" />
									<p className="text-sm text-muted-foreground">
										{dropzone.isDragActive ? "Drop files here" : "Select or drag and drop files"}
									</p>
								</>
							)}
						</div>
						{isDirty && (
							<div className="flex justify-end gap-2">
								<Button type="button" variant="outline" size="sm" disabled={saving} onClick={onCancelEdit}>
									Cancel
								</Button>
								<Button type="button" size="sm" disabled={saving} onClick={onSave}>
									{saving && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
									Save
								</Button>
							</div>
						)}
					</div>
				) : (
					<div>
						{files.length > 0 ? (
							<div className="space-y-2">
								{files.map((file) => (
									<div key={file.fileId} className="flex items-center gap-2 rounded-lg border px-3 py-2">
										<FileIcon className="h-4 w-4 text-muted-foreground shrink-0" />
										<span className="text-sm truncate">{file.name}</span>
									</div>
								))}
							</div>
						) : (
							<p className="text-sm text-muted-foreground">No attachments</p>
						)}
					</div>
				)}
			</div>
		</div>
	);
};

export default AttachmentsCard;
