import { useState } from "react";
import { useDropzone } from "react-dropzone";
import { useFormContext } from "react-hook-form";
import type { UpdateQuoteIntroForm } from "@repo/zod/quote";
import { presignUpload, uploadFileToS3 } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ImageIcon, X, Loader2, Pencil, Trash2 } from "lucide-react";

export interface IntroImage {
	fileId: string;
	preview: string;
}

interface IntroCardProps {
	isEdit: boolean;
	onEdit: () => void;
	onCancelEdit: () => void;
	onRemoveSection: () => void;
	initialImage?: IntroImage | null;
}

const IntroCard = ({ isEdit, onEdit, onCancelEdit, onRemoveSection, initialImage }: IntroCardProps) => {
	const { register, setValue, formState: { isSubmitting }, watch } = useFormContext<UpdateQuoteIntroForm>();
	const [image, setImage] = useState<IntroImage | null>(initialImage ?? null);
	const [uploading, setUploading] = useState(false);

	const title = watch("title");
	const description = watch("description");

	const dropzone = useDropzone({
		accept: { "image/*": [] },
		multiple: false,
		disabled: !isEdit,
		onDrop: async (acceptedFiles) => {
			const file = acceptedFiles[0];
			if (!file) return;

			const preview = URL.createObjectURL(file);
			setUploading(true);
			try {
				const { fileId, uploadUrl } = await presignUpload(file.name, file.type);
				await uploadFileToS3(uploadUrl, file);
				setImage({ fileId, preview });
				setValue("imageFileId", fileId, { shouldDirty: true });
			} catch (err) {
				console.error("Image upload failed:", err);
				URL.revokeObjectURL(preview);
			} finally {
				setUploading(false);
			}
		},
	});

	const handleRemoveImage = () => {
		if (image) {
			URL.revokeObjectURL(image.preview);
			setImage(null);
			setValue("imageFileId", null, { shouldDirty: true });
		}
	};

	return (
		<div className="rounded-xl px-2 border bg-background">
			<div className="py-4 px-2 flex items-center justify-between">
				<h3 className="text-lg font-medium">Introduction</h3>
				{isEdit ? (
					<Button type="button" variant="ghost" size="sm" className="h-7 text-xs text-destructive" onClick={onRemoveSection} disabled={isSubmitting}>
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
					<div className="space-y-4">
						{image ? (
							<div className="relative group">
								<img src={image.preview} alt="Cover" className="h-[250px] w-full rounded-lg object-contain" />
								<Button
									type="button"
									variant="destructive"
									size="icon"
									className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
									onClick={handleRemoveImage}
									disabled={isSubmitting}
								>
									<X className="h-3 w-3" />
								</Button>
							</div>
						) : (
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
											{dropzone.isDragActive ? "Drop image here" : "Add cover image"}
										</p>
									</>
								)}
							</div>
						)}

						<Input placeholder="Title" {...register("title")} disabled={isSubmitting} />

						<Textarea
							placeholder="Description"
							{...register("description")}
							rows={4}
							className="resize-none"
							disabled={isSubmitting}
						/>

						<div className="flex justify-end gap-2">
							<Button type="button" variant="outline" size="sm" disabled={isSubmitting} onClick={onCancelEdit}>
								Cancel
							</Button>
							<Button type="submit" size="sm" disabled={isSubmitting}>
								{isSubmitting && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
								Save
							</Button>
						</div>
					</div>
				) : (
					<div className="space-y-3">
						{image && (
							<img src={image.preview} alt="Cover" className="h-[250px] w-full rounded-lg object-contain" />
						)}
						{title && <p className="text-sm font-medium">{title}</p>}
						{description && <p className="text-sm text-muted-foreground whitespace-pre-wrap">{description}</p>}
						{!image && !title && !description && (
							<p className="text-sm text-muted-foreground">No introduction content</p>
						)}
					</div>
				)}
			</div>
		</div>
	);
};

export default IntroCard;
