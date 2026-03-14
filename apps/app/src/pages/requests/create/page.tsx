import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { useNavigate } from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useDropzone } from "react-dropzone";
import { getClients } from "@/pages/clients/api";
import { presignUpload, uploadFileToS3 } from "@/lib/api";
import { createRequest } from "../api";
import ImageDropzone, { type UploadedFile } from "@/components/image-dropzone";
import LineItemsCard, { type LineItemUI, createEmptyLineItem } from "@/components/line-items-card";
import { Upload, X, Loader2, Plus } from "lucide-react";
import { StickyFooter } from "@/components/sticky-footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import type { CreateRequestForm } from "@repo/zod/request";

const CreateRequestPage = () => {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const [uploadedImages, setUploadedImages] = useState<UploadedFile[]>([]);
	const [noteFiles, setNoteFiles] = useState<UploadedFile[]>([]);
	const [uploadingNotes, setUploadingNotes] = useState(false);
	const [lineItems, setLineItems] = useState<LineItemUI[]>([]);

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

	const noteDropzone = useDropzone({
		onDrop: async (acceptedFiles) => {
			setUploadingNotes(true);
			try {
				const results = await Promise.all(
					acceptedFiles.map(async (file) => {
						const { fileId, uploadUrl } = await presignUpload(file.name, file.type);
						await uploadFileToS3(uploadUrl, file);
						return { fileId, name: file.name, preview: "" };
					}),
				);
				setNoteFiles((prev) => [...prev, ...results]);
			} catch (err) {
				console.error("File upload failed:", err);
			} finally {
				setUploadingNotes(false);
			}
		},
	});

	const removeNoteFile = (index: number) => {
		setNoteFiles((prev) => prev.filter((_, i) => i !== index));
	};

	const {
		register,
		handleSubmit,
		control,
		formState: { errors },
	} = useForm<CreateRequestForm>({
		defaultValues: {
			title: "",
			clientId: "",
			serviceDescription: "",
			assessmentInstructions: "",
			assessmentStartDate: "",
			assessmentEndDate: "",
			assessmentStartTime: "",
			assessmentEndTime: "",
			scheduleLater: false,
			anytime: false,
			teamReminder: "none",
			internalNotes: "",
			fileIds: [],
			lineItems: [],
		},
	});

	const onSubmit = (data: CreateRequestForm) => {
		const allFileIds = [
			...uploadedImages.map((f) => f.fileId),
			...noteFiles.map((f) => f.fileId),
		];
		mutation.mutate({
			...data,
			fileIds: allFileIds,
			lineItems: lineItems.map((item) => ({
				name: item.name,
				description: item.description || undefined,
				qty: item.qty,
				unitPrice: item.unitPrice,
				imageFileId: item.imageFileId || undefined,
			})),
		});
	};

	const isUploading = uploadingNotes || lineItems.some((i) => i.imageUploading);

	return (
		<StickyFooter.Root>
			<StickyFooter.Content className="max-w-4xl mx-auto">
			<h2 className="text-2xl font-semibold mt-8 mb-8">New Request</h2>
			<form id="request-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
				{/* Overview */}
				<div className="space-y-4">
					<h3 className="text-lg font-medium">Overview</h3>
					<div className="space-y-2">
						<Label htmlFor="title">Title</Label>
						<Input
							id="title"
							placeholder="e.g. Plumbing repair needed"
							{...register("title", { required: "Title is required" })}
						/>
						{errors.title && (
							<p className="text-sm text-destructive">{errors.title.message}</p>
						)}
					</div>
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
				</div>

				{/* Service Details */}
				<div className="space-y-4">
					<div>
						<Label htmlFor="serviceDescription">Service details</Label>
						<p className="text-sm text-muted-foreground">Please provide as much information as you can</p>
					</div>
					<Textarea
						id="serviceDescription"
						placeholder="Describe the service needed..."
						rows={4}
						{...register("serviceDescription", { required: "Service details are required" })}
					/>
					{errors.serviceDescription && (
						<p className="text-sm text-destructive">{errors.serviceDescription.message}</p>
					)}

					{/* Image Upload */}
					<ImageDropzone images={uploadedImages} onChange={setUploadedImages} />
				</div>

				{/* On-site Assessment */}
				<div className="space-y-4">
					<h3 className="text-lg font-medium">On-site assessment</h3>
					<div className="space-y-2">
						<Label htmlFor="assessmentInstructions">Instructions</Label>
						<Textarea
							id="assessmentInstructions"
							placeholder="Add instructions for the assessment..."
							rows={3}
							{...register("assessmentInstructions")}
						/>
					</div>

					<div className="grid grid-cols-2 gap-6">
						{/* Left Column - Schedule */}
						<div className="space-y-4">
							<h4 className="text-sm font-semibold">Schedule</h4>
							<div className="grid grid-cols-2 gap-3">
								<div className="space-y-2">
									<Label>Start date</Label>
									<Input type="date" {...register("assessmentStartDate")} />
								</div>
								<div className="space-y-2">
									<Label>End date</Label>
									<Input type="date" {...register("assessmentEndDate")} />
								</div>
							</div>
							<Controller
								control={control}
								name="scheduleLater"
								render={({ field }) => (
									<div className="flex items-center gap-2">
										<Checkbox id="scheduleLater" checked={field.value} onCheckedChange={field.onChange} />
										<Label htmlFor="scheduleLater" className="font-normal">Schedule later</Label>
									</div>
								)}
							/>
							<div className="grid grid-cols-2 gap-3">
								<div className="space-y-2">
									<Label>Start time</Label>
									<Input type="time" {...register("assessmentStartTime")} />
								</div>
								<div className="space-y-2">
									<Label>End time</Label>
									<Input type="time" {...register("assessmentEndTime")} />
								</div>
							</div>
							<Controller
								control={control}
								name="anytime"
								render={({ field }) => (
									<div className="flex items-center gap-2">
										<Checkbox id="anytime" checked={field.value} onCheckedChange={field.onChange} />
										<Label htmlFor="anytime" className="font-normal">Anytime</Label>
									</div>
								)}
							/>
						</div>

						{/* Right Column - Team */}
						<div className="space-y-4">
							<h4 className="text-sm font-semibold">Team</h4>
							<div className="space-y-2">
								<Label>Assign team</Label>
								<Select>
									<SelectTrigger>
										<SelectValue placeholder="Select team member" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="unassigned">Unassigned</SelectItem>
									</SelectContent>
								</Select>
							</div>
							<div className="flex items-center gap-2">
								<Checkbox id="emailOnAssign" />
								<Label htmlFor="emailOnAssign" className="font-normal">Email when team is assigned</Label>
							</div>

							<hr />

							<div className="space-y-2">
								<h4 className="text-sm font-semibold">Team reminder</h4>
								<Label>Remind team</Label>
								<Controller
									control={control}
									name="teamReminder"
									render={({ field }) => (
										<Select onValueChange={field.onChange} value={field.value}>
											<SelectTrigger>
												<SelectValue placeholder="No reminder set" />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="none">No reminder set</SelectItem>
												<SelectItem value="at_start">At start of task</SelectItem>
												<SelectItem value="30min">30 minutes before</SelectItem>
												<SelectItem value="1hour">1 hour before</SelectItem>
												<SelectItem value="2hour">2 hours before</SelectItem>
												<SelectItem value="5hour">5 hours before</SelectItem>
												<SelectItem value="24hour">24 hours before</SelectItem>
											</SelectContent>
										</Select>
									)}
								/>
							</div>
						</div>
					</div>
				</div>

				{/* Product / Service */}
				<LineItemsCard items={lineItems} onChange={setLineItems} />

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
						{...noteDropzone.getRootProps()}
						className={`rounded-lg border-2 border-dashed p-8 text-center cursor-pointer transition-colors ${
							noteDropzone.isDragActive ? "border-primary bg-primary/5" : "border-border"
						}`}
					>
						<input {...noteDropzone.getInputProps()} />
						{uploadingNotes ? (
							<>
								<Loader2 className="mx-auto h-8 w-8 text-muted-foreground mb-2 animate-spin" />
								<p className="text-sm text-muted-foreground">Uploading...</p>
							</>
						) : (
							<>
								<Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
								<p className="text-sm text-muted-foreground">
									{noteDropzone.isDragActive ? "Drop your files here" : "Drag your files here"}
								</p>
							</>
						)}
					</div>
					{noteFiles.length > 0 && (
						<div className="space-y-2">
							{noteFiles.map((file, index) => (
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
										onClick={() => removeNoteFile(index)}
									>
										<X className="h-4 w-4" />
									</Button>
								</div>
							))}
						</div>
					)}
				</div>

				{mutation.isError && (
					<p className="text-sm text-destructive">{mutation.error.message}</p>
				)}
			</form>
			</StickyFooter.Content>
			<StickyFooter.Bar
				className="max-w-4xl"
				left={
					<Button variant="outline" onClick={() => navigate("/requests")}>
						Cancel
					</Button>
				}
				right={
					<Button type="submit" form="request-form" disabled={mutation.isPending || isUploading}>
						{mutation.isPending ? "Saving..." : "Save Request"}
					</Button>
				}
			/>
		</StickyFooter.Root>
	);
};

export default CreateRequestPage;
