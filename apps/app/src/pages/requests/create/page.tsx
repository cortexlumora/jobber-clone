import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { useNavigate } from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useDropzone } from "react-dropzone";
import { getClients, presignUpload, uploadFileToS3, createRequest } from "@/lib/api";
import { Upload, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import type { CreateRequestForm } from "@repo/zod/request";

interface UploadedFile {
	fileId: string;
	name: string;
}

const CreateRequestPage = () => {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
	const [uploading, setUploading] = useState(false);

	const { data: clients } = useQuery({
		queryKey: ["clients"],
		queryFn: getClients,
	});

	const mutation = useMutation({
		mutationFn: createRequest,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["requests"] });
			navigate("/requests");
		},
	});

	const { getRootProps, getInputProps, isDragActive } = useDropzone({
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
				setUploadedFiles((prev) => [...prev, ...results]);
			} catch (err) {
				console.error("File upload failed:", err);
			} finally {
				setUploading(false);
			}
		},
	});

	const removeFile = (index: number) => {
		setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
	};

	const {
		register,
		handleSubmit,
		control,
		formState: { errors },
	} = useForm<CreateRequestForm>({
		defaultValues: {
			clientId: "",
			serviceDescription: "",
			bestDay: "",
			alternateDay: "",
			preferredArrival: "anytime",
			assessmentRequired: false,
			internalNotes: "",
			fileIds: [],
		},
	});

	const onSubmit = (data: CreateRequestForm) => {
		mutation.mutate({
			...data,
			fileIds: uploadedFiles.map((f) => f.fileId),
		});
	};

	return (
		<div className="max-w-2xl mx-auto">
			<h2 className="text-2xl font-semibold mt-8 mb-8">New Request</h2>
			<form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
				{/* Client */}
				<div className="space-y-2">
					<Label>Client</Label>
					<Controller
						control={control}
						name="clientId"
						rules={{ required: "Client is required" }}
						render={({ field }) => (
							<Select onValueChange={field.onChange} value={field.value}>
								<SelectTrigger>
									<SelectValue placeholder="Select a client" />
								</SelectTrigger>
								<SelectContent>
									{clients?.map((client) => (
										<SelectItem key={client.id} value={client.id}>
											{client.useCompanyAsPrimary && client.companyName
												? client.companyName
												: `${client.firstName} ${client.lastName}`}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						)}
					/>
					{errors.clientId && (
						<p className="text-sm text-destructive">{errors.clientId.message}</p>
					)}
				</div>

				{/* Service Description */}
				<div className="space-y-2">
					<Label htmlFor="serviceDescription">Service Description</Label>
					<Textarea
						id="serviceDescription"
						placeholder="Describe the service needed..."
						rows={4}
						{...register("serviceDescription", { required: "Service description is required" })}
					/>
					{errors.serviceDescription && (
						<p className="text-sm text-destructive">{errors.serviceDescription.message}</p>
					)}
				</div>

				{/* Availability */}
				<div className="space-y-4">
					<h3 className="text-lg font-medium">Your Availability</h3>
					<div className="space-y-2">
						<Label htmlFor="bestDay">Which day would be best for assessment of the work?</Label>
						<Input
							id="bestDay"
							type="date"
							{...register("bestDay", { required: "Best day is required" })}
						/>
						{errors.bestDay && (
							<p className="text-sm text-destructive">{errors.bestDay.message}</p>
						)}
					</div>
					<div className="space-y-2">
						<Label htmlFor="alternateDay">Which is another day that works for you?</Label>
						<Input
							id="alternateDay"
							type="date"
							{...register("alternateDay")}
						/>
					</div>
					<div className="space-y-2">
						<Label>What are your preferred arrival times?</Label>
						<Controller
							control={control}
							name="preferredArrival"
							render={({ field }) => (
								<Select onValueChange={field.onChange} value={field.value}>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="morning">Morning</SelectItem>
										<SelectItem value="anytime">Any Time</SelectItem>
										<SelectItem value="afternoon">Afternoon</SelectItem>
									</SelectContent>
								</Select>
							)}
						/>
					</div>
				</div>

				{/* Assessment */}
				<div className="space-y-4">
					<Controller
						control={control}
						name="assessmentRequired"
						render={({ field }) => (
							<div className="flex items-center justify-between">
								<div className="space-y-0.5">
									<Label htmlFor="assessmentRequired">On-site assessment required</Label>
									<p className="text-sm text-muted-foreground">
										Schedule an assessment to collect more info before the job
									</p>
								</div>
								<Switch
									id="assessmentRequired"
									checked={field.value}
									onCheckedChange={field.onChange}
								/>
							</div>
						)}
					/>
				</div>

				{/* Internal Notes */}
				<div className="space-y-4">
					<div>
						<h3 className="text-lg font-medium">Internal Notes</h3>
						<p className="text-sm text-muted-foreground">
							Internal notes will only be seen by your team
						</p>
					</div>
					<div className="space-y-2">
						<Label htmlFor="internalNotes">Notes</Label>
						<Textarea
							id="internalNotes"
							placeholder="Add notes for your team..."
							rows={4}
							{...register("internalNotes")}
						/>
					</div>
					<div
						{...getRootProps()}
						className={`rounded-lg border-2 border-dashed p-8 text-center cursor-pointer transition-colors ${
							isDragActive ? "border-primary bg-primary/5" : "border-border"
						}`}
					>
						<input {...getInputProps()} />
						{uploading ? (
							<>
								<Loader2 className="mx-auto h-8 w-8 text-muted-foreground mb-2 animate-spin" />
								<p className="text-sm text-muted-foreground">Uploading...</p>
							</>
						) : (
							<>
								<Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
								<p className="text-sm text-muted-foreground">
									{isDragActive ? "Drop your files here" : "Drag your files here"}
								</p>
							</>
						)}
					</div>
					{uploadedFiles.length > 0 && (
						<div className="space-y-2">
							{uploadedFiles.map((file, index) => (
								<div
									key={file.fileId}
									className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
								>
									<span className="truncate">{file.name}</span>
									<Button
										type="button"
										variant="ghost"
										size="icon"
										className="h-6 w-6"
										onClick={() => removeFile(index)}
									>
										<X className="h-4 w-4" />
									</Button>
								</div>
							))}
						</div>
					)}
				</div>

				{/* Actions */}
				{mutation.isError && (
					<p className="text-sm text-destructive">{mutation.error.message}</p>
				)}
				<div className="flex gap-2 pt-2">
					<Button type="submit" disabled={mutation.isPending || uploading}>
						{mutation.isPending ? "Saving..." : "Save Request"}
					</Button>
					<Button type="button" variant="outline" onClick={() => navigate("/requests")}>
						Cancel
					</Button>
				</div>
			</form>
		</div>
	);
};

export default CreateRequestPage;
