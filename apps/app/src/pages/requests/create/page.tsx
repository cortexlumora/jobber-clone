import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { useNavigate } from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useDropzone } from "react-dropzone";
import { getClients, presignUpload, uploadFileToS3, createRequest } from "@/lib/api";
import { Upload, X, Loader2, Plus } from "lucide-react";
import { StickyFooter } from "@/components/sticky-footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

interface UploadedFile {
	fileId: string;
	name: string;
	preview: string;
}

interface LineItemUI {
	name: string;
	description: string;
	qty: number;
	unitPrice: number;
	imageFileId: string | null;
	imagePreview: string | null;
	imageUploading: boolean;
}

const CreateRequestPage = () => {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const [uploadedImages, setUploadedImages] = useState<UploadedFile[]>([]);
	const [uploadingImages, setUploadingImages] = useState(false);
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

	const imageDropzone = useDropzone({
		accept: { "image/*": [] },
		onDrop: async (acceptedFiles) => {
			setUploadingImages(true);
			try {
				const results = await Promise.all(
					acceptedFiles.map(async (file) => {
						const { fileId, uploadUrl } = await presignUpload(file.name, file.type);
						await uploadFileToS3(uploadUrl, file);
						return { fileId, name: file.name, preview: URL.createObjectURL(file) };
					}),
				);
				setUploadedImages((prev) => [...prev, ...results]);
			} catch (err) {
				console.error("Image upload failed:", err);
			} finally {
				setUploadingImages(false);
			}
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

	const removeImage = (index: number) => {
		setUploadedImages((prev) => prev.filter((_, i) => i !== index));
	};

	const removeNoteFile = (index: number) => {
		setNoteFiles((prev) => prev.filter((_, i) => i !== index));
	};

	const addLineItem = () => {
		setLineItems((prev) => [...prev, { name: "", description: "", qty: 1, unitPrice: 0, imageFileId: null, imagePreview: null, imageUploading: false }]);
	};

	const updateLineItem = (index: number, updates: Partial<LineItemUI>) => {
		setLineItems((prev) => prev.map((item, i) => i === index ? { ...item, ...updates } : item));
	};

	const removeLineItem = (index: number) => {
		setLineItems((prev) => prev.filter((_, i) => i !== index));
	};

	const handleLineItemImage = async (index: number, file: File) => {
		updateLineItem(index, { imageUploading: true });
		try {
			const { fileId, uploadUrl } = await presignUpload(file.name, file.type);
			await uploadFileToS3(uploadUrl, file);
			updateLineItem(index, { imageFileId: fileId, imagePreview: URL.createObjectURL(file), imageUploading: false });
		} catch {
			updateLineItem(index, { imageUploading: false });
		}
	};

	const subtotal = lineItems.reduce((sum, item) => sum + item.qty * item.unitPrice, 0);

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

	const isUploading = uploadingImages || uploadingNotes || lineItems.some((i) => i.imageUploading);

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
					<div className="space-y-3">
						<p className="text-sm text-muted-foreground">Share images of the work to be done</p>
						{uploadedImages.length > 0 && (
							<div className="flex flex-wrap gap-3">
								{uploadedImages.map((file, index) => (
									<div key={file.fileId} className="relative group">
										<img
											src={file.preview}
											alt={file.name}
											className="h-24 w-24 rounded-lg object-cover border"
										/>
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
							{...imageDropzone.getRootProps()}
							className={`rounded-lg border-2 border-dashed p-6 text-center cursor-pointer transition-colors ${
								imageDropzone.isDragActive ? "border-primary bg-primary/5" : "border-border"
							}`}
						>
							<input {...imageDropzone.getInputProps()} />
							{uploadingImages ? (
								<>
									<Loader2 className="mx-auto h-6 w-6 text-muted-foreground mb-1 animate-spin" />
									<p className="text-sm text-muted-foreground">Uploading...</p>
								</>
							) : (
								<>
									<Upload className="mx-auto h-6 w-6 text-muted-foreground mb-1" />
									<p className="text-sm text-muted-foreground">
										{imageDropzone.isDragActive ? "Drop images here" : "Drag images here or click to browse"}
									</p>
								</>
							)}
						</div>
					</div>
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
				<Card>
					<CardHeader className="pb-3">
						<CardTitle className="text-lg font-medium">Product / Service</CardTitle>
						<p className="text-sm text-muted-foreground">
							Keep everything on track by adding products and services.
						</p>
					</CardHeader>
					<CardContent className="space-y-4">
						{lineItems.length > 0 && (
							<div className="space-y-4">
								{lineItems.map((item, index) => (
									<div key={index} className="rounded-lg border p-4 space-y-3">
										<div className="flex items-start gap-3">
											<div className="grid grid-cols-[1fr_80px_100px_80px] gap-3 flex-1">
												<div className="space-y-1">
													<Label className="text-xs">Name</Label>
													<Input
														placeholder="Product or service name"
														value={item.name}
														onChange={(e) => updateLineItem(index, { name: e.target.value })}
													/>
												</div>
												<div className="space-y-1">
													<Label className="text-xs">Qty</Label>
													<Input
														type="number"
														min={1}
														value={item.qty}
														onChange={(e) => updateLineItem(index, { qty: Number(e.target.value) })}
													/>
												</div>
												<div className="space-y-1">
													<Label className="text-xs">Unit Price</Label>
													<Input
														type="number"
														min={0}
														step="0.01"
														value={item.unitPrice}
														onChange={(e) => updateLineItem(index, { unitPrice: Number(e.target.value) })}
													/>
												</div>
												<div className="space-y-1">
													<Label className="text-xs">Total</Label>
													<div className="flex items-center h-9 px-3 text-sm border rounded-md bg-muted/50">
														${(item.qty * item.unitPrice).toFixed(2)}
													</div>
												</div>
											</div>
											<Button
												type="button"
												variant="ghost"
												size="icon"
												className="mt-5 h-9 w-9 shrink-0"
												onClick={() => removeLineItem(index)}
											>
												<X className="h-4 w-4" />
											</Button>
										</div>
										<div className="grid grid-cols-[1fr_auto] gap-3">
											<div className="space-y-1">
												<Label className="text-xs">Description</Label>
												<Textarea
													placeholder="Line item description"
													rows={2}
													value={item.description}
													onChange={(e) => updateLineItem(index, { description: e.target.value })}
												/>
											</div>
											<div className="self-end">
												<Label className="text-xs mb-1 block">Image</Label>
												{item.imageUploading ? (
													<div className="flex items-center justify-center h-[60px] w-[60px] rounded border">
														<Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
													</div>
												) : item.imagePreview ? (
													<div className="relative group h-[60px] w-[60px]">
														<img src={item.imagePreview} alt="" className="h-full w-full rounded object-cover border" />
														<Button
															type="button"
															variant="destructive"
															size="icon"
															className="absolute -top-1 -right-1 h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity"
															onClick={() => updateLineItem(index, { imageFileId: null, imagePreview: null })}
														>
															<X className="h-2.5 w-2.5" />
														</Button>
													</div>
												) : (
													<label className="flex items-center justify-center h-[60px] w-[60px] rounded border border-dashed cursor-pointer hover:bg-muted/50 transition-colors">
														<Plus className="h-4 w-4 text-muted-foreground" />
														<input
															type="file"
															accept="image/*"
															className="hidden"
															onChange={(e) => {
																const file = e.target.files?.[0];
																if (file) handleLineItemImage(index, file);
															}}
														/>
													</label>
												)}
											</div>
										</div>
									</div>
								))}
							</div>
						)}
						<Button type="button" variant="outline" size="sm" onClick={addLineItem}>
							<Plus className="h-4 w-4 mr-1" />
							Add Line Item
						</Button>
						<div className="space-y-2 pt-2 border-t">
							<div className="flex items-center justify-between">
								<span className="text-sm text-muted-foreground">Subtotal</span>
								<span className="text-sm">${subtotal.toFixed(2)}</span>
							</div>
							<div className="flex items-center justify-between">
								<span className="text-sm font-semibold">Total</span>
								<span className="text-sm font-semibold">${subtotal.toFixed(2)}</span>
							</div>
						</div>
					</CardContent>
				</Card>

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
