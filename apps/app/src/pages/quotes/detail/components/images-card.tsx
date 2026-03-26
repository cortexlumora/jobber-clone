import { useState } from "react";
import { useDropzone } from "react-dropzone";
import { presignUpload, uploadFileToS3 } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { ImageIcon, X, Loader2, Pencil, Trash2 } from "lucide-react";

export interface ImageFile {
	fileId: string;
	name: string;
	preview: string;
}

interface ImagesCardProps {
	isEdit: boolean;
	isDirty: boolean;
	onEdit: () => void;
	onCancelEdit: () => void;
	onSave: () => void;
	onRemoveSection: () => void;
	files: ImageFile[];
	onAdd: (files: ImageFile[]) => void;
	onRemoveFile: (fileId: string) => void;
	saving?: boolean;
}

const ImagesCard = ({ isEdit, isDirty, onEdit, onCancelEdit, onSave, onRemoveSection, files, onAdd, onRemoveFile, saving }: ImagesCardProps) => {
	const [uploading, setUploading] = useState(false);

	const dropzone = useDropzone({
		accept: { "image/*": [] },
		disabled: !isEdit,
		onDrop: async (acceptedFiles) => {
			setUploading(true);
			try {
				const results = await Promise.all(
					acceptedFiles.map(async (file) => {
						const preview = URL.createObjectURL(file);
						const { fileId, uploadUrl } = await presignUpload(file.name, file.type);
						await uploadFileToS3(uploadUrl, file);
						return { fileId, name: file.name, preview };
					}),
				);
				onAdd(results);
			} catch (err) {
				console.error("Image upload failed:", err);
			} finally {
				setUploading(false);
			}
		},
	});

	return (
		<div className="rounded-xl px-2 border bg-background">
			<div className="py-4 px-2 flex items-center justify-between">
				<h3 className="text-lg font-medium">Images</h3>
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
							<div className="grid grid-cols-3 gap-3">
								{files.map((file) => (
									<div key={file.fileId} className="relative group">
										<img src={file.preview} alt={file.name} className="h-28 rounded-lg object-contain" />
										<Button
											type="button"
											variant="destructive"
											size="icon"
											className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
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
									<ImageIcon className="h-6 w-6 text-muted-foreground" />
									<p className="text-sm text-muted-foreground">
										{dropzone.isDragActive ? "Drop images here" : "Select or drag and drop images"}
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
							<div className="grid grid-cols-3 gap-3">
								{files.map((file) => (
									<img key={file.fileId} src={file.preview} alt={file.name} className="h-28 w-full rounded-lg object-cover" />
								))}
							</div>
						) : (
							<p className="text-sm text-muted-foreground">No images</p>
						)}
					</div>
				)}
			</div>
		</div>
	);
};

export default ImagesCard;
