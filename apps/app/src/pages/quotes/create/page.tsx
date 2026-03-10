import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getClients } from "@/pages/clients/api";
import { presignUpload, uploadFileToS3 } from "@/lib/api";
import { createQuote } from "../api";
import { useDropzone } from "react-dropzone";
import { Plus, X, Upload, Loader2, Image as ImageIcon } from "lucide-react";
import { createQuoteSchema, type CreateQuoteForm } from "@repo/zod/quote";
import { StickyFooter } from "@/components/sticky-footer";
import { CustomFieldDialog } from "@/components/custom-field-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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

interface LineItemUI {
	type: "line_item" | "text";
	name: string;
	description: string;
	qty: number;
	unitPrice: number;
	imageFileId: string | null;
	imagePreview: string | null;
	imageUploading: boolean;
}

interface UploadedFile {
	fileId: string;
	name: string;
	preview?: string;
}

const CreateQuotePage = () => {
	const navigate = useNavigate();

	const {
		register,
		handleSubmit,
		control,
		watch,
		setValue,
		formState: { errors },
	} = useForm<CreateQuoteForm>({
		resolver: zodResolver(createQuoteSchema),
		defaultValues: {
			title: "",
			clientId: "",
			quoteNumber: "1",
			salesperson: "",
			introTitle: "",
			introDescription: "",
			discount: "",
			tax: "",
			depositType: "none",
			depositMode: "%",
			depositValue: "",
			scheduleMode: "%",
			payments: [
				{ label: "Payment 1", amount: "", description: "" },
				{ label: "Payment 2", amount: "", description: "" },
			],
			clientMessage: "",
			contract: "",
			applyContractToAll: false,
			notes: "",
		},
	});

	// Watched form values
	const depositType = watch("depositType");
	const depositMode = watch("depositMode");
	const depositValue = watch("depositValue");
	const payments = watch("payments") ?? [];
	const scheduleMode = watch("scheduleMode");
	const discount = watch("discount");
	const tax = watch("tax");

	// UI-only state (not part of form schema)
	const [introImage, setIntroImage] = useState<UploadedFile | null>(null);
	const [uploadingIntroImage, setUploadingIntroImage] = useState(false);
	const [showIntroduction, setShowIntroduction] = useState(false);
	const [customFieldDialogOpen, setCustomFieldDialogOpen] = useState(false);
	const [lineItems, setLineItems] = useState<LineItemUI[]>([]);
	const [depositDialogOpen, setDepositDialogOpen] = useState(false);
	// Dialog temp state
	const [dialogDepositType, setDialogDepositType] = useState<"deposit" | "schedule">("deposit");
	const [dialogDepositMode, setDialogDepositMode] = useState<"%" | "$">("%");
	const [dialogDepositValue, setDialogDepositValue] = useState("");
	const [dialogPayments, setDialogPayments] = useState<{ label: string; amount: string; description: string }[]>([
		{ label: "Payment 1", amount: "", description: "" },
		{ label: "Payment 2", amount: "", description: "" },
	]);
	const [dialogScheduleMode, setDialogScheduleMode] = useState<"%" | "$">("%");
	const [attachments, setAttachments] = useState<UploadedFile[]>([]);
	const [uploadingAttachments, setUploadingAttachments] = useState(false);
	const [images, setImages] = useState<UploadedFile[]>([]);
	const [uploadingImages, setUploadingImages] = useState(false);
	const [showAttachments, setShowAttachments] = useState(false);
	const [showImages, setShowImages] = useState(false);
	const [showClientMessage, setShowClientMessage] = useState(false);
	const [noteFiles, setNoteFiles] = useState<UploadedFile[]>([]);
	const [uploadingNotes, setUploadingNotes] = useState(false);

	const { data: clients } = useQuery({
		queryKey: ["clients"],
		queryFn: getClients,
	});

	const addLineItem = () => {
		setLineItems((prev) => [...prev, { type: "line_item", name: "", description: "", qty: 1, unitPrice: 0, imageFileId: null, imagePreview: null, imageUploading: false }]);
	};

	const addTextItem = () => {
		setLineItems((prev) => [...prev, { type: "text", name: "", description: "", qty: 0, unitPrice: 0, imageFileId: null, imagePreview: null, imageUploading: false }]);
	};

	const updateLineItem = (index: number, updates: Partial<LineItemUI>) => {
		setLineItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...updates } : item)));
	};

	const removeLineItem = (index: number) => {
		setLineItems((prev) => prev.filter((_, i) => i !== index));
	};

	const attachmentDropzone = useDropzone({
		onDrop: async (acceptedFiles) => {
			setUploadingAttachments(true);
			try {
				const results = await Promise.all(
					acceptedFiles.map(async (file) => {
						const { fileId, uploadUrl } = await presignUpload(file.name, file.type);
						await uploadFileToS3(uploadUrl, file);
						return { fileId, name: file.name };
					}),
				);
				setAttachments((prev) => [...prev, ...results]);
			} catch (err) {
				console.error("Upload failed:", err);
			} finally {
				setUploadingAttachments(false);
			}
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
				setImages((prev) => [...prev, ...results]);
			} catch (err) {
				console.error("Upload failed:", err);
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
						return { fileId, name: file.name };
					}),
				);
				setNoteFiles((prev) => [...prev, ...results]);
			} catch (err) {
				console.error("Upload failed:", err);
			} finally {
				setUploadingNotes(false);
			}
		},
	});

	const removeFile = (setter: React.Dispatch<React.SetStateAction<UploadedFile[]>>, index: number) => {
		setter((prev) => prev.filter((_, i) => i !== index));
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

	const subtotal = lineItems.filter((i) => i.type === "line_item").reduce((sum, item) => sum + item.qty * item.unitPrice, 0);
	const discountAmount = discount ? Number(discount) : 0;
	const taxAmount = tax ? Number(tax) : 0;
	const total = subtotal - discountAmount + taxAmount;

	const mutation = useMutation({
		mutationFn: createQuote,
		onSuccess: () => {
			navigate("/quotes");
		},
	});

	const onSubmit = (data: CreateQuoteForm) => {
		mutation.mutate({
			...data,
			introImageFileId: introImage?.fileId,
			lineItems: lineItems.map((item) => ({
				type: item.type,
				name: item.name,
				description: item.description || undefined,
				qty: item.qty,
				unitPrice: item.unitPrice,
				imageFileId: item.imageFileId || undefined,
			})),
			attachmentFileIds: attachments.map((f) => f.fileId),
			imageFileIds: images.map((f) => f.fileId),
			noteFileIds: noteFiles.map((f) => f.fileId),
		});
	};

	return (
		<>
		<StickyFooter.Root>
			<StickyFooter.Content className="max-w-4xl mx-auto">
				<h2 className="text-2xl font-semibold mt-8 mb-8">New Quote</h2>
				<form id="quote-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
					{/* Overview */}
					<div className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="title">Title</Label>
							<Input
								id="title"
								placeholder="e.g. Landscaping quote"
								{...register("title")}
							/>
							{errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
						</div>
						<div className="space-y-2">
							<Label>Client</Label>
							<Controller
								name="clientId"
								control={control}
								render={({ field }) => (
									<Select value={field.value} onValueChange={field.onChange}>
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
							{errors.clientId && <p className="text-sm text-destructive">{errors.clientId.message}</p>}
						</div>
					</div>

					{/* Quote Details */}
					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="quoteNumber">Quote #</Label>
							<Input
								id="quoteNumber"
								{...register("quoteNumber")}
							/>
						</div>
						<div className="space-y-2">
							<Label>Salesperson</Label>
							<Controller
								name="salesperson"
								control={control}
								render={({ field }) => (
									<Select value={field.value} onValueChange={field.onChange}>
										<SelectTrigger>
											<SelectValue placeholder="Select salesperson" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="unassigned">Unassigned</SelectItem>
										</SelectContent>
									</Select>
								)}
							/>
						</div>
					</div>

					{/* Customize */}
					<div className="flex flex-col gap-2">
						<Button type="button" variant="outline" size="sm" className="w-fit" onClick={() => setCustomFieldDialogOpen(true)}>
							Add field
						</Button>
						{!showIntroduction && (
							<Button type="button" variant="outline" size="sm" className="w-fit" onClick={() => setShowIntroduction(true)}>
								<Plus className="h-4 w-4 mr-1" />
								Introduction
							</Button>
						)}
					</div>

					{/* Introduction */}
					{showIntroduction && (
						<div className="space-y-3">
							<div className="flex items-center justify-between">
								<h3 className="text-lg font-medium">Introduction</h3>
								<Button
									type="button"
									variant="ghost"
									size="icon"
									className="h-6 w-6"
									onClick={() => { setShowIntroduction(false); setValue("introTitle", ""); setValue("introDescription", ""); setIntroImage(null); setValue("introImageFileId", undefined); }}
								>
									<X className="h-4 w-4" />
								</Button>
							</div>
							<div className="space-y-1">
								<Label className="text-sm">Image</Label>
								{uploadingIntroImage ? (
									<div className="flex items-center justify-center h-24 w-24 rounded border">
										<Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
									</div>
								) : introImage ? (
									<div className="relative group h-24 w-24">
										<img src={introImage.preview} alt="" className="h-full w-full rounded object-cover border" />
										<Button
											type="button"
											variant="destructive"
											size="icon"
											className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
											onClick={() => setIntroImage(null)}
										>
											<X className="h-3 w-3" />
										</Button>
									</div>
								) : (
									<label className="flex items-center justify-center h-24 w-24 rounded border border-dashed cursor-pointer hover:bg-muted/50 transition-colors">
										<Plus className="h-5 w-5 text-muted-foreground" />
										<input
											type="file"
											accept="image/*"
											className="hidden"
											onChange={async (e) => {
												const file = e.target.files?.[0];
												if (!file) return;
												setUploadingIntroImage(true);
												try {
													const { fileId, uploadUrl } = await presignUpload(file.name, file.type);
													await uploadFileToS3(uploadUrl, file);
													setIntroImage({ fileId, name: file.name, preview: URL.createObjectURL(file) });
													setValue("introImageFileId", fileId);
												} catch (err) {
													console.error("Upload failed:", err);
												} finally {
													setUploadingIntroImage(false);
												}
											}}
										/>
									</label>
								)}
							</div>
							<div className="space-y-1">
								<Label className="text-sm">Title</Label>
								<Input
									placeholder="Add a title..."
									{...register("introTitle")}
								/>
							</div>
							<div className="space-y-1">
								<Label className="text-sm">Description</Label>
								<Textarea
									placeholder="Add a description..."
									rows={3}
									{...register("introDescription")}
								/>
							</div>
						</div>
					)}

					{/* Product / Service */}
					<Card>
						<CardHeader className="pb-3">
							<CardTitle className="text-lg font-medium">Product / Service</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							{lineItems.length > 0 && (
								<div className="space-y-4">
									{lineItems.map((item, index) =>
										item.type === "line_item" ? (
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
															<Label className="text-xs">Quantity</Label>
															<Input
																type="number"
																min={1}
																value={item.qty}
																onChange={(e) => updateLineItem(index, { qty: Number(e.target.value) })}
															/>
														</div>
														<div className="space-y-1">
															<Label className="text-xs">Unit price</Label>
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
												<div className="space-y-1">
													<Label className="text-xs">Description</Label>
													<Textarea
														placeholder="Line item description"
														rows={2}
														value={item.description}
														onChange={(e) => updateLineItem(index, { description: e.target.value })}
													/>
												</div>
											</div>
										) : (
											<div key={index} className="rounded-lg border p-4 space-y-3">
												<div className="flex items-start gap-3">
													<div className="flex-1 space-y-1">
														<Label className="text-xs">Name</Label>
														<Input
															placeholder="Text item name"
															value={item.name}
															onChange={(e) => updateLineItem(index, { name: e.target.value })}
														/>
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
															placeholder="Add text..."
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
										),
									)}
								</div>
							)}
							<div className="flex gap-2">
								<Button type="button" variant="outline" size="sm" onClick={addLineItem}>
									<Plus className="h-4 w-4 mr-1" />
									Add Line Item
								</Button>
								<Button type="button" variant="outline" size="sm" onClick={addTextItem}>
									<Plus className="h-4 w-4 mr-1" />
									Add Text
								</Button>
							</div>

							{/* Totals */}
							<div className="space-y-3 pt-4 border-t">
								<div className="flex items-center justify-between">
									<span className="text-sm text-muted-foreground">Subtotal</span>
									<span className="text-sm">${subtotal.toFixed(2)}</span>
								</div>

								{/* Discount */}
								<div className="flex items-center justify-between">
									<span className="text-sm text-muted-foreground">Discount</span>
									{discount !== "" ? (
										<div className="flex items-center gap-2">
											<Input
												type="number"
												min={0}
												step="0.01"
												className="w-28 h-8 text-sm"
												{...register("discount")}
											/>
											<Button
												type="button"
												variant="ghost"
												size="icon"
												className="h-6 w-6"
												onClick={() => setValue("discount", "")}
											>
												<X className="h-3 w-3" />
											</Button>
										</div>
									) : (
										<Button
											type="button"
											variant="link"
											size="sm"
											className="h-auto p-0 text-sm"
											onClick={() => setValue("discount", "0")}
										>
											Add Discount
										</Button>
									)}
								</div>

								{/* Tax */}
								<div className="flex items-center justify-between">
									<span className="text-sm text-muted-foreground">Tax</span>
									{tax !== "" ? (
										<div className="flex items-center gap-2">
											<Input
												type="number"
												min={0}
												step="0.01"
												className="w-28 h-8 text-sm"
												{...register("tax")}
											/>
											<Button
												type="button"
												variant="ghost"
												size="icon"
												className="h-6 w-6"
												onClick={() => setValue("tax", "")}
											>
												<X className="h-3 w-3" />
											</Button>
										</div>
									) : (
										<Button
											type="button"
											variant="link"
											size="sm"
											className="h-auto p-0 text-sm"
											onClick={() => setValue("tax", "0")}
										>
											Add Tax
										</Button>
									)}
								</div>

								<div className="flex items-center justify-between pt-2 border-t">
									<span className="text-sm font-semibold">Total</span>
									<span className="text-sm font-semibold">${total.toFixed(2)}</span>
								</div>
							</div>

							{/* Deposit / Payment Schedule */}
							{depositType !== "none" ? (
								<div className="space-y-2 pt-2">
									<div className="flex items-center justify-between">
										<Label className="text-sm font-medium">
											{depositType === "deposit" ? "Deposit" : "Payment Schedule"}
										</Label>
										<div className="flex items-center gap-1">
											<Button
												type="button"
												variant="ghost"
												size="sm"
												className="h-auto p-0 text-xs text-muted-foreground underline"
												onClick={() => {
													setDialogDepositType(depositType as "deposit" | "schedule");
													setDialogDepositMode(depositMode);
													setDialogDepositValue(depositValue ?? "");
													setDialogPayments([...payments]);
													setDialogScheduleMode(scheduleMode);
													setDepositDialogOpen(true);
												}}
											>
												Edit
											</Button>
											<Button
												type="button"
												variant="ghost"
												size="icon"
												className="h-6 w-6"
												onClick={() => { setValue("depositType", "none"); setValue("depositValue", ""); }}
											>
												<X className="h-3 w-3" />
											</Button>
										</div>
									</div>
									{depositType === "deposit" && (
										<p className="text-sm text-muted-foreground">
											{depositValue}{depositMode === "%" ? "%" : "$"} deposit on approval
										</p>
									)}
									{depositType === "schedule" && (
										<div className="space-y-2">
											<div className="grid grid-cols-3 gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
												<span>{scheduleMode === "%" ? "% of job" : "Amount"}</span>
												<span>Description</span>
												<span className="text-right">Total</span>
											</div>
											{payments.map((p, i) => {
												const amt = Number(p.amount) || 0;
												const paymentTotal = scheduleMode === "%" ? (total * amt) / 100 : amt;
												return (
													<div key={i} className="grid grid-cols-3 gap-2 text-sm">
														<span>{p.amount}{scheduleMode === "%" ? "%" : ""}</span>
														<span className="text-muted-foreground">{p.description || p.label}</span>
														<span className="text-right">${paymentTotal.toFixed(2)}</span>
													</div>
												);
											})}
										</div>
									)}
								</div>
							) : (
								<Button
									type="button"
									variant="link"
									size="sm"
									className="h-auto p-0 text-sm underline"
									onClick={() => {
										setDialogDepositType("deposit");
										setDialogDepositMode("%");
										setDialogDepositValue("");
										setDialogPayments([{ label: "Payment 1", amount: "", description: "" }, { label: "Payment 2", amount: "", description: "" }]);
										setDialogScheduleMode("%");
										setDepositDialogOpen(true);
									}}

								>
									Add Deposit or Payment Schedule
								</Button>
							)}

						</CardContent>
					</Card>

					{/* Optional sections */}
					{showAttachments && (
						<div className="space-y-3">
							<div className="flex items-center justify-between">
								<div>
									<h3 className="text-lg font-medium">Attachments</h3>
									<p className="text-sm text-muted-foreground">Include all attachments for your quote in one place</p>
								</div>
								<Button
									type="button"
									variant="ghost"
									size="icon"
									className="h-6 w-6"
									onClick={() => { setShowAttachments(false); setAttachments([]); }}
								>
									<X className="h-4 w-4" />
								</Button>
							</div>
							<p className="text-xs text-muted-foreground">{attachments.length} of 10 uploaded</p>
							{attachments.length > 0 && (
								<div className="space-y-2">
									{attachments.map((file, index) => (
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
												onClick={() => removeFile(setAttachments, index)}
											>
												<X className="h-4 w-4" />
											</Button>
										</div>
									))}
								</div>
							)}
							{attachments.length < 10 && (
								<div
									{...attachmentDropzone.getRootProps()}
									className={`rounded-lg border-2 border-dashed p-6 text-center cursor-pointer transition-colors ${
										attachmentDropzone.isDragActive ? "border-primary bg-primary/5" : "border-border"
									}`}
								>
									<input {...attachmentDropzone.getInputProps()} />
									{uploadingAttachments ? (
										<>
											<Loader2 className="mx-auto h-6 w-6 text-muted-foreground mb-1 animate-spin" />
											<p className="text-sm text-muted-foreground">Uploading...</p>
										</>
									) : (
										<>
											<Upload className="mx-auto h-6 w-6 text-muted-foreground mb-1" />
											<p className="text-sm text-muted-foreground">
												{attachmentDropzone.isDragActive ? "Drop files here" : "Drag files here or click to browse"}
											</p>
										</>
									)}
								</div>
							)}
						</div>
					)}

					{showImages && (
						<div className="space-y-3">
							<div className="flex items-center justify-between">
								<div>
									<h3 className="text-lg font-medium">Images</h3>
									<p className="text-sm text-muted-foreground">Add images to showcase your past work</p>
								</div>
								<Button
									type="button"
									variant="ghost"
									size="icon"
									className="h-6 w-6"
									onClick={() => { setShowImages(false); setImages([]); }}
								>
									<X className="h-4 w-4" />
								</Button>
							</div>
							<p className="text-xs text-muted-foreground">{images.length} of 10 uploaded</p>
							{images.length > 0 && (
								<div className="flex flex-wrap gap-3">
									{images.map((file, index) => (
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
												onClick={() => removeFile(setImages, index)}
											>
												<X className="h-3 w-3" />
											</Button>
										</div>
									))}
								</div>
							)}
							{images.length < 10 && (
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
											<ImageIcon className="mx-auto h-6 w-6 text-muted-foreground mb-1" />
											<p className="text-sm text-muted-foreground">
												{imageDropzone.isDragActive ? "Drop images here" : "Drag images here or click to browse"}
											</p>
										</>
									)}
								</div>
							)}
						</div>
					)}

					{showClientMessage && (
						<div className="space-y-2">
							<div className="flex items-center justify-between">
								<h3 className="text-lg font-medium">Client message</h3>
								<Button
									type="button"
									variant="ghost"
									size="icon"
									className="h-6 w-6"
									onClick={() => { setShowClientMessage(false); setValue("clientMessage", ""); }}
								>
									<X className="h-4 w-4" />
								</Button>
							</div>
							<Label className="text-sm">Description</Label>
							<Textarea
								placeholder="Add a message for your client..."
								rows={3}
								{...register("clientMessage")}
							/>
						</div>
					)}

					{/* Add section buttons */}
					{(!showAttachments || !showImages || !showClientMessage) && (
						<div className="flex flex-wrap gap-2">
							{!showAttachments && (
								<Button type="button" variant="outline" size="sm" onClick={() => setShowAttachments(true)}>
									<Plus className="h-4 w-4 mr-1" />
									Attachments
								</Button>
							)}
							{!showImages && (
								<Button type="button" variant="outline" size="sm" onClick={() => setShowImages(true)}>
									<Plus className="h-4 w-4 mr-1" />
									Images
								</Button>
							)}
							{!showClientMessage && (
								<Button type="button" variant="outline" size="sm" onClick={() => setShowClientMessage(true)}>
									<Plus className="h-4 w-4 mr-1" />
									Client message
								</Button>
							)}
						</div>
					)}

					{/* Contract / Disclaimer */}
					<div className="space-y-2">
						<h3 className="text-lg font-medium">Contract / Disclaimer</h3>
						<Label className="text-sm">Description</Label>
						<Textarea
							placeholder="Add a description..."
							rows={3}
							{...register("contract")}
						/>
						<div className="flex items-center gap-2">
							<Controller
								name="applyContractToAll"
								control={control}
								render={({ field }) => (
									<Checkbox
										id="applyContractToAll"
										checked={field.value ?? false}
										onCheckedChange={(checked) => field.onChange(checked === true)}
									/>
								)}
							/>
							<Label htmlFor="applyContractToAll" className="font-normal">
								Apply to all future quotes
							</Label>
						</div>
					</div>

					{/* Notes */}
					<div className="space-y-4">
						<div>
							<h3 className="text-lg font-medium">Notes</h3>
							<p className="text-sm text-muted-foreground">
								Internal notes will only be seen by your team
							</p>
						</div>
						<Textarea
							placeholder="Leave a note..."
							rows={4}
							{...register("notes")}
						/>
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
										{noteDropzone.isDragActive ? "Drop your files here" : "Drag your files here or click to browse"}
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
											onClick={() => removeFile(setNoteFiles, index)}
										>
											<X className="h-4 w-4" />
										</Button>
									</div>
								))}
							</div>
						)}
					</div>
				</form>
			</StickyFooter.Content>
			<StickyFooter.Bar
				className="max-w-4xl"
				left={
					<Button variant="outline" onClick={() => navigate("/quotes")}>
						Cancel
					</Button>
				}
				right={
					<Button type="submit" form="quote-form" disabled={mutation.isPending}>
						{mutation.isPending ? "Saving..." : "Save Quote"}
					</Button>
				}
			/>
		</StickyFooter.Root>

		<CustomFieldDialog
			open={customFieldDialogOpen}
			onOpenChange={setCustomFieldDialogOpen}
			appliesTo="quote"
			appliesToLabel="All quotes"
		/>

		{/* Deposit / Payment Schedule Dialog */}
		<Dialog open={depositDialogOpen} onOpenChange={setDepositDialogOpen}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Deposit or Payment Schedule</DialogTitle>
				</DialogHeader>
				<div className="space-y-4 py-2">
					<RadioGroup
						value={dialogDepositType}
						onValueChange={(v) => setDialogDepositType(v as "deposit" | "schedule")}
						className="space-y-4"
					>
						<div className="flex items-start gap-3">
							<RadioGroupItem value="deposit" id="deposit-only" className="mt-1" />
							<div>
								<Label htmlFor="deposit-only" className="font-medium">Deposit only</Label>
								<p className="text-sm text-muted-foreground">Collect an upfront payment on quote approval</p>
							</div>
						</div>

						{dialogDepositType === "deposit" && (
							<div className="ml-7 flex items-center gap-2">
								<div className="flex items-center rounded-md border">
									<button
										type="button"
										className={`px-3 py-1.5 text-sm font-medium rounded-l-md transition-colors ${dialogDepositMode === "%" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
										onClick={() => setDialogDepositMode("%")}
									>
										%
									</button>
									<button
										type="button"
										className={`px-3 py-1.5 text-sm font-medium rounded-r-md transition-colors ${dialogDepositMode === "$" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
										onClick={() => setDialogDepositMode("$")}
									>
										$
									</button>
								</div>
								<Input
									type="number"
									min={0}
									step="0.01"
									placeholder={dialogDepositMode === "%" ? "e.g. 50" : "e.g. 500"}
									className="w-32"
									value={dialogDepositValue}
									onChange={(e) => setDialogDepositValue(e.target.value)}
								/>
							</div>
						)}

						<div className="flex items-start gap-3">
							<RadioGroupItem value="schedule" id="payment-schedule" className="mt-1" />
							<div>
								<Label htmlFor="payment-schedule" className="font-medium">Payment Schedule</Label>
								<p className="text-sm text-muted-foreground">Split the job into multiple invoices</p>
							</div>
						</div>

						{dialogDepositType === "schedule" && (
							<div className="ml-7 space-y-4">
								{/* Split by toggle */}
								<div className="flex items-center gap-2">
									<span className="text-sm text-muted-foreground">Split payments by</span>
									<div className="flex items-center rounded-md border">
										<button
											type="button"
											className={`px-3 py-1.5 text-sm font-medium rounded-l-md transition-colors ${dialogScheduleMode === "%" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
											onClick={() => setDialogScheduleMode("%")}
										>
											%
										</button>
										<button
											type="button"
											className={`px-3 py-1.5 text-sm font-medium rounded-r-md transition-colors ${dialogScheduleMode === "$" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
											onClick={() => setDialogScheduleMode("$")}
										>
											$
										</button>
									</div>
								</div>

								{/* Header */}
								<div className="grid grid-cols-[1fr_100px_1fr_auto] gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
									<span />
									<span>Amount</span>
									<span>Description</span>
									<span className="w-8" />
								</div>

								{/* Payment rows */}
								{dialogPayments.map((p, i) => (
									<div key={i} className="grid grid-cols-[1fr_100px_1fr_auto] gap-2 items-center">
										<Input
											value={p.label}
											onChange={(e) => {
												const updated = [...dialogPayments];
												updated[i] = { ...updated[i], label: e.target.value };
												setDialogPayments(updated);
											}}
										/>
										<Input
											type="number"
											min={0}
											step="0.01"
											placeholder={dialogScheduleMode === "%" ? "%" : "$"}
											value={p.amount}
											onChange={(e) => {
												const updated = [...dialogPayments];
												updated[i] = { ...updated[i], amount: e.target.value };
												setDialogPayments(updated);
											}}
										/>
										<Input
											placeholder="Description"
											value={p.description}
											onChange={(e) => {
												const updated = [...dialogPayments];
												updated[i] = { ...updated[i], description: e.target.value };
												setDialogPayments(updated);
											}}
										/>
										{dialogPayments.length > 2 && (
											<Button
												type="button"
												variant="ghost"
												size="icon"
												className="h-8 w-8 shrink-0"
												onClick={() => setDialogPayments((prev) => prev.filter((_, idx) => idx !== i))}
											>
												<X className="h-4 w-4" />
											</Button>
										)}
										{dialogPayments.length <= 2 && <div className="w-8" />}
									</div>
								))}

								<Button
									type="button"
									variant="link"
									size="sm"
									className="h-auto p-0 text-sm underline"
									onClick={() => setDialogPayments((prev) => [...prev, { label: `Payment ${prev.length + 1}`, amount: "", description: "" }])}
								>
									Add Invoice to Payment Schedule
								</Button>

								{/* Totals */}
								<div className="space-y-1 pt-2 border-t">
									<div className="flex items-center justify-between text-sm">
										<span className="text-muted-foreground">Job Total</span>
										<span className="font-medium">${total.toFixed(2)}</span>
									</div>
									<div className="flex items-center justify-between text-sm">
										<span className="text-muted-foreground">Remaining</span>
										<span className="font-medium">
											{dialogScheduleMode === "%"
												? `${Math.max(0, 100 - dialogPayments.reduce((s, p) => s + (Number(p.amount) || 0), 0))}%`
												: `$${Math.max(0, total - dialogPayments.reduce((s, p) => s + (Number(p.amount) || 0), 0)).toFixed(2)}`
											}
										</span>
									</div>
								</div>
							</div>
						)}
					</RadioGroup>
				</div>
				<DialogFooter className="flex justify-between sm:justify-between">
					{depositType !== "none" && (
						<Button
							type="button"
							variant="destructive"
							onClick={() => {
								setValue("depositType", "none");
								setValue("depositValue", "");
								setDepositDialogOpen(false);
							}}
						>
							Delete
						</Button>
					)}
					<div className="flex gap-2">
						<Button type="button" variant="outline" onClick={() => setDepositDialogOpen(false)}>
							Cancel
						</Button>
						<Button
							type="button"
							onClick={() => {
								setValue("depositType", dialogDepositType);
								setValue("depositMode", dialogDepositMode);
								setValue("depositValue", dialogDepositValue);
								setValue("payments", [...dialogPayments]);
								setValue("scheduleMode", dialogScheduleMode);
								setDepositDialogOpen(false);
							}}
						>
							Save
						</Button>
					</div>
				</DialogFooter>
			</DialogContent>
		</Dialog>
		</>
	);
};

export default CreateQuotePage;
