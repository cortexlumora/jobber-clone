import { useState } from "react";
import { useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { getClients, presignUpload, uploadFileToS3 } from "@/lib/api";
import { useDropzone } from "react-dropzone";
import { Plus, X, Upload, Loader2, Image as ImageIcon } from "lucide-react";
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

interface LineItemUI {
	name: string;
	description: string;
	qty: number;
	unitPrice: number;
}

interface UploadedFile {
	fileId: string;
	name: string;
	preview?: string;
}

const CreateQuotePage = () => {
	const navigate = useNavigate();
	const [title, setTitle] = useState("");
	const [clientId, setClientId] = useState("");
	const [quoteNumber, setQuoteNumber] = useState("1");
	const [salesperson, setSalesperson] = useState("");
	const [introduction, setIntroduction] = useState("");
	const [lineItems, setLineItems] = useState<LineItemUI[]>([]);
	const [discount, setDiscount] = useState("");
	const [tax, setTax] = useState("");
	const [depositNote, setDepositNote] = useState("");
	const [attachments, setAttachments] = useState<UploadedFile[]>([]);
	const [uploadingAttachments, setUploadingAttachments] = useState(false);
	const [images, setImages] = useState<UploadedFile[]>([]);
	const [uploadingImages, setUploadingImages] = useState(false);
	const [clientMessage, setClientMessage] = useState("");
	const [showAttachments, setShowAttachments] = useState(false);
	const [showImages, setShowImages] = useState(false);
	const [showClientMessage, setShowClientMessage] = useState(false);
	const [contract, setContract] = useState("");
	const [applyContractToAll, setApplyContractToAll] = useState(false);
	const [notes, setNotes] = useState("");
	const [noteFiles, setNoteFiles] = useState<UploadedFile[]>([]);
	const [uploadingNotes, setUploadingNotes] = useState(false);

	const { data: clients } = useQuery({
		queryKey: ["clients"],
		queryFn: getClients,
	});

	const addLineItem = () => {
		setLineItems((prev) => [...prev, { name: "", description: "", qty: 1, unitPrice: 0 }]);
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

	const subtotal = lineItems.reduce((sum, item) => sum + item.qty * item.unitPrice, 0);
	const discountAmount = discount ? Number(discount) : 0;
	const taxAmount = tax ? Number(tax) : 0;
	const total = subtotal - discountAmount + taxAmount;

	return (
		<StickyFooter.Root>
			<StickyFooter.Content className="max-w-4xl mx-auto">
				<h2 className="text-2xl font-semibold mt-8 mb-8">New Quote</h2>
				<div className="space-y-6">
					{/* Overview */}
					<div className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="title">Title</Label>
							<Input
								id="title"
								placeholder="e.g. Landscaping quote"
								value={title}
								onChange={(e) => setTitle(e.target.value)}
							/>
						</div>
						<div className="space-y-2">
							<Label>Client</Label>
							<Select value={clientId} onValueChange={setClientId}>
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
						</div>
					</div>

					{/* Quote Details */}
					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="quoteNumber">Quote #</Label>
							<Input
								id="quoteNumber"
								value={quoteNumber}
								onChange={(e) => setQuoteNumber(e.target.value)}
							/>
						</div>
						<div className="space-y-2">
							<Label>Salesperson</Label>
							<Select value={salesperson} onValueChange={setSalesperson}>
								<SelectTrigger>
									<SelectValue placeholder="Select salesperson" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="unassigned">Unassigned</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>

					{/* Customize */}
					<div className="flex gap-2">
						<Button type="button" variant="outline" size="sm">
							<Plus className="h-4 w-4 mr-1" />
							Add field
						</Button>
						<Button type="button" variant="outline" size="sm">
							<Plus className="h-4 w-4 mr-1" />
							Add section
						</Button>
					</div>

					{/* Introduction */}
					<div className="space-y-2">
						<h3 className="text-lg font-medium">Introduction</h3>
						<Textarea
							placeholder="Add an introduction for this quote..."
							rows={3}
							value={introduction}
							onChange={(e) => setIntroduction(e.target.value)}
						/>
					</div>

					{/* Product / Service */}
					<Card>
						<CardHeader className="pb-3">
							<CardTitle className="text-lg font-medium">Product / Service</CardTitle>
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
									))}
								</div>
							)}
							<div className="flex gap-2">
								<Button type="button" variant="outline" size="sm" onClick={addLineItem}>
									<Plus className="h-4 w-4 mr-1" />
									Add Line Item
								</Button>
								<Button type="button" variant="outline" size="sm">
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
												value={discount}
												onChange={(e) => setDiscount(e.target.value)}
											/>
											<Button
												type="button"
												variant="ghost"
												size="icon"
												className="h-6 w-6"
												onClick={() => setDiscount("")}
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
											onClick={() => setDiscount("0")}
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
												value={tax}
												onChange={(e) => setTax(e.target.value)}
											/>
											<Button
												type="button"
												variant="ghost"
												size="icon"
												className="h-6 w-6"
												onClick={() => setTax("")}
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
											onClick={() => setTax("0")}
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
							{depositNote !== "" ? (
								<div className="space-y-2 pt-2">
									<div className="flex items-center justify-between">
										<Label className="text-sm">Deposit / Payment schedule</Label>
										<Button
											type="button"
											variant="ghost"
											size="icon"
											className="h-6 w-6"
											onClick={() => setDepositNote("")}
										>
											<X className="h-3 w-3" />
										</Button>
									</div>
									<Textarea
										placeholder="e.g. 50% deposit required before work begins"
										rows={2}
										value={depositNote}
										onChange={(e) => setDepositNote(e.target.value)}
									/>
								</div>
							) : (
								<Button
									type="button"
									variant="outline"
									size="sm"
									onClick={() => setDepositNote(" ")}
								>
									<Plus className="h-4 w-4 mr-1" />
									Add Deposit or Payment Schedule
								</Button>
							)}

							<Button type="button" variant="outline" size="sm">
								<Plus className="h-4 w-4 mr-1" />
								Add section
							</Button>
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
									onClick={() => { setShowClientMessage(false); setClientMessage(""); }}
								>
									<X className="h-4 w-4" />
								</Button>
							</div>
							<Label className="text-sm">Description</Label>
							<Textarea
								placeholder="Add a message for your client..."
								rows={3}
								value={clientMessage}
								onChange={(e) => setClientMessage(e.target.value)}
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
							value={contract}
							onChange={(e) => setContract(e.target.value)}
						/>
						<div className="flex items-center gap-2">
							<Checkbox
								id="applyContractToAll"
								checked={applyContractToAll}
								onCheckedChange={(checked) => setApplyContractToAll(checked === true)}
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
							value={notes}
							onChange={(e) => setNotes(e.target.value)}
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
				</div>
			</StickyFooter.Content>
			<StickyFooter.Bar
				className="max-w-4xl"
				left={
					<Button variant="outline" onClick={() => navigate("/quotes")}>
						Cancel
					</Button>
				}
				right={
					<Button>
						Save Quote
					</Button>
				}
			/>
		</StickyFooter.Root>
	);
};

export default CreateQuotePage;
