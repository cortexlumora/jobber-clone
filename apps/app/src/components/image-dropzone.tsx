import { useState } from "react";
import { useDropzone } from "react-dropzone";
import { presignUpload, uploadFileToS3 } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Upload, Loader2, X, ImageIcon } from "lucide-react";

export interface UploadedFile {
	fileId: string;
	name: string;
	preview: string;
}

interface ImageDropzoneProps {
	images: UploadedFile[];
	onChange: (images: UploadedFile[]) => void;
	label?: string;
}

const ImageDropzone = ({ images, onChange, label = "Share images of the work to be done" }: ImageDropzoneProps) => {
	const [uploading, setUploading] = useState(false);

	const dropzone = useDropzone({
		accept: { "image/*": [] },
		onDrop: async (acceptedFiles) => {
			setUploading(true);
			try {
				const results = await Promise.all(
					acceptedFiles.map(async (file) => {
						const { fileId, uploadUrl } = await presignUpload(file.name, file.type);
						await uploadFileToS3(uploadUrl, file);
						return { fileId, name: file.name, preview: URL.createObjectURL(file) };
					}),
				);
				onChange([...images, ...results]);
			} catch (err) {
				console.error("Image upload failed:", err);
			} finally {
				setUploading(false);
			}
		},
	});

	const removeImage = (index: number) => {
		onChange(images.filter((_, i) => i !== index));
	};

	return (
		<div className="space-y-3">
			<p className="text-sm text-muted-foreground">{label}</p>
			{images.length > 0 && (
				<div className="flex flex-wrap gap-3">
					{images.map((file, index) => (
						<div key={file.fileId} className="relative group">
							{file.preview ? (
								<img
									src={file.preview}
									alt={file.name}
									className="h-24 w-24 rounded-lg object-cover border"
								/>
							) : (
								<div className="h-24 w-24 rounded-lg border bg-muted flex items-center justify-center">
									<ImageIcon className="h-6 w-6 text-muted-foreground" />
								</div>
							)}
							<Button
								type="button"
								variant="destructive"
								size="icon"
								className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
								onClick={() => removeImage(index)}
							>
								<X className="h-3 w-3" />
							</Button>
						</div>
					))}
				</div>
			)}
			<div
				{...dropzone.getRootProps()}
				className={`rounded-lg border-2 border-dashed p-6 text-center cursor-pointer transition-colors ${
					dropzone.isDragActive ? "border-primary bg-primary/5" : "border-border"
				}`}
			>
				<input {...dropzone.getInputProps()} />
				{uploading ? (
					<>
						<Loader2 className="mx-auto h-6 w-6 text-muted-foreground mb-1 animate-spin" />
						<p className="text-sm text-muted-foreground">Uploading...</p>
					</>
				) : (
					<>
						<Upload className="mx-auto h-6 w-6 text-muted-foreground mb-1" />
						<p className="text-sm text-muted-foreground">
							{dropzone.isDragActive ? "Drop images here" : "Drag images here or click to browse"}
						</p>
					</>
				)}
			</div>
		</div>
	);
};

export default ImageDropzone;
