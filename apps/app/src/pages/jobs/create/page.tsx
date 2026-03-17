import { useEffect, useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRequestQuery } from "@/pages/requests/hooks";
import { useQuoteQuery } from "@/pages/quotes/hooks";
import { getClients } from "@/pages/clients/api";
import { createJob } from "../api";
import { presignUpload, uploadFileToS3 } from "@/lib/api";
import { useDropzone } from "react-dropzone";
import { Plus, X, Upload, Loader2 } from "lucide-react";
import { StickyFooter } from "@/components/sticky-footer";
import { CustomFieldDialog } from "@/components/custom-field-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
	unitCost: number;
	unitPrice: number;
}

interface UploadedFile {
	fileId: string;
	name: string;
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const CreateJobPage = () => {
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	const requestId = searchParams.get("requestId");
	const quoteId = searchParams.get("quoteId");
	const { data: sourceRequest } = useRequestQuery(requestId);
	const { data: sourceQuote } = useQuoteQuery(quoteId);

	// Form state
	const [title, setTitle] = useState("");
	const [clientId, setClientId] = useState("");
	const [jobNumber, setJobNumber] = useState("1");
	const [salesperson, setSalesperson] = useState("");
	const [jobType, setJobType] = useState<"one_off" | "recurring">("one_off");
	const [customFieldDialogOpen, setCustomFieldDialogOpen] = useState(false);

	// Schedule
	const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
	const [startTime, setStartTime] = useState("");
	const [endTime, setEndTime] = useState("");

	// Recurring
	const [repeats, setRepeats] = useState("weekly");
	const [repeatDays, setRepeatDays] = useState<string[]>(["Sun"]);
	const [endsType, setEndsType] = useState<"after" | "on">("after");
	const [endsAfterVisits, setEndsAfterVisits] = useState("27");
	const [endsOnDate, setEndsOnDate] = useState("");
	const [visitInstructions, setVisitInstructions] = useState("");

	// Billing (recurring only)
	const [billingType, setBillingType] = useState<"visit_based" | "fixed_price">("visit_based");
	const [invoiceFrequency, setInvoiceFrequency] = useState("monthly");

	// Line items
	const [lineItems, setLineItems] = useState<LineItemUI[]>([]);

	// Notes
	const [notes, setNotes] = useState("");
	const [noteFiles, setNoteFiles] = useState<UploadedFile[]>([]);
	const [uploadingNotes, setUploadingNotes] = useState(false);

	// Link to related
	const [relatedObject, setRelatedObject] = useState("");

	// Pre-fill from request or quote if converting
	useEffect(() => {
		if (sourceRequest) {
			setTitle(sourceRequest.title);
			setClientId(sourceRequest.clientId);
			if (sourceRequest.lineItems.length > 0) {
				setLineItems(sourceRequest.lineItems.map((item) => ({
					name: item.name,
					description: item.description ?? "",
					qty: item.qty,
					unitCost: 0,
					unitPrice: Number(item.unitPrice),
				})));
			}
		} else if (sourceQuote) {
			setTitle(sourceQuote.title);
			setClientId(sourceQuote.clientId);
			if (sourceQuote.lineItems.length > 0) {
				setLineItems(sourceQuote.lineItems.map((item) => ({
					name: item.name,
					description: item.description ?? "",
					qty: item.qty,
					unitCost: 0,
					unitPrice: Number(item.unitPrice),
				})));
			}
		}
	}, [sourceRequest, sourceQuote]);

	const { data: clients } = useQuery({
		queryKey: ["clients"],
		queryFn: getClients,
	});

	// Line item helpers
	const addLineItem = () => {
		setLineItems((prev) => [...prev, { name: "", description: "", qty: 1, unitCost: 0, unitPrice: 0 }]);
	};

	const updateLineItem = (index: number, updates: Partial<LineItemUI>) => {
		setLineItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...updates } : item)));
	};

	const removeLineItem = (index: number) => {
		setLineItems((prev) => prev.filter((_, i) => i !== index));
	};

	const totalCost = lineItems.reduce((sum, item) => sum + item.qty * item.unitCost, 0);
	const totalPrice = lineItems.reduce((sum, item) => sum + item.qty * item.unitPrice, 0);

	// Recurring schedule computations
	const totalVisits = useMemo(() => {
		if (jobType !== "recurring") return 1;
		if (endsType === "after") return Number(endsAfterVisits) || 0;
		// When ends on date, approximate
		if (endsType === "on" && endsOnDate && startDate) {
			const start = new Date(startDate);
			const end = new Date(endsOnDate);
			const diffDays = Math.ceil((end.getTime() - start.getTime()) / 86400000);
			if (repeats === "weekly") return Math.ceil(diffDays / 7) * (repeatDays.length || 1);
			if (repeats === "biweekly") return Math.ceil(diffDays / 14) * (repeatDays.length || 1);
			if (repeats === "monthly") return Math.ceil(diffDays / 30);
			return Math.ceil(diffDays / 7);
		}
		return 0;
	}, [jobType, endsType, endsAfterVisits, endsOnDate, startDate, repeats, repeatDays]);

	const lastDate = useMemo(() => {
		if (jobType !== "recurring" || !startDate) return "";
		if (endsType === "on") return endsOnDate;
		// Approximate last date from visits
		const start = new Date(startDate);
		const visits = Number(endsAfterVisits) || 1;
		let daysToAdd = 0;
		if (repeats === "weekly") daysToAdd = Math.ceil(visits / (repeatDays.length || 1)) * 7;
		else if (repeats === "biweekly") daysToAdd = Math.ceil(visits / (repeatDays.length || 1)) * 14;
		else if (repeats === "monthly") daysToAdd = visits * 30;
		else daysToAdd = visits * 7;
		const end = new Date(start.getTime() + daysToAdd * 86400000);
		return end.toISOString().slice(0, 10);
	}, [jobType, startDate, endsType, endsAfterVisits, repeats, repeatDays, endsOnDate]);

	// Billing schedule computations
	const totalInvoices = useMemo(() => {
		if (jobType !== "recurring" || !startDate || !lastDate) return 0;
		const start = new Date(startDate);
		const end = new Date(lastDate);
		const diffDays = Math.ceil((end.getTime() - start.getTime()) / 86400000);
		if (invoiceFrequency === "monthly") return Math.ceil(diffDays / 30) || 1;
		if (invoiceFrequency === "bimonthly") return Math.ceil(diffDays / 60) || 1;
		if (invoiceFrequency === "quarterly") return Math.ceil(diffDays / 90) || 1;
		if (invoiceFrequency === "yearly") return Math.ceil(diffDays / 365) || 1;
		return 1;
	}, [jobType, startDate, lastDate, invoiceFrequency]);

	const toggleDay = (day: string) => {
		setRepeatDays((prev) =>
			prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
		);
	};

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

	const mutation = useMutation({
		mutationFn: createJob,
		onSuccess: () => {
			navigate("/jobs");
		},
	});

	const handleSave = () => {
		mutation.mutate({
			title,
			clientId,
			jobNumber: jobNumber || undefined,
			salesperson: salesperson || undefined,
			jobType,
			startDate: startDate || undefined,
			startTime: startTime || undefined,
			endTime: endTime || undefined,
			repeats: jobType === "recurring" ? repeats : undefined,
			repeatDays: jobType === "recurring" ? repeatDays : undefined,
			endsType: jobType === "recurring" ? endsType : undefined,
			endsAfterVisits: jobType === "recurring" && endsType === "after" ? Number(endsAfterVisits) || undefined : undefined,
			endsOnDate: jobType === "recurring" && endsType === "on" ? endsOnDate || undefined : undefined,
			visitInstructions: visitInstructions || undefined,
			billingType: jobType === "recurring" ? billingType : undefined,
			invoiceFrequency: jobType === "recurring" ? invoiceFrequency : undefined,
			lineItems: lineItems.map((item) => ({
				name: item.name,
				description: item.description || undefined,
				qty: item.qty,
				unitCost: item.unitCost,
				unitPrice: item.unitPrice,
			})),
			relatedRequestId: requestId || undefined,
			relatedQuoteId: quoteId || undefined,
		});
	};

	const formatDisplayDate = (dateStr: string) => {
		if (!dateStr) return "";
		const d = new Date(dateStr + "T00:00:00");
		return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
	};

	return (
		<>
		<StickyFooter.Root>
			<StickyFooter.Content className="max-w-4xl mx-auto">
				<h2 className="text-2xl font-semibold mt-8 mb-8">New Job</h2>
				<div className="space-y-6">
					{/* Title & Client */}
					<div className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="title">Title</Label>
							<Input
								id="title"
								placeholder="e.g. Weekly lawn maintenance"
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

					{/* Job # & Salesperson */}
					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="jobNumber">Job #</Label>
							<Input
								id="jobNumber"
								value={jobNumber}
								onChange={(e) => setJobNumber(e.target.value)}
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

					{/* Assign */}
					<div className="space-y-2">
						<Label>Assign</Label>
						<p className="text-sm text-muted-foreground">Team members will be assigned to this job</p>
					</div>

					{/* Customize */}
					<div className="flex flex-col gap-2">
						<Button type="button" variant="outline" size="sm" className="w-fit" onClick={() => setCustomFieldDialogOpen(true)}>
							Add field
						</Button>
					</div>

					{/* Job Type */}
					<div className="space-y-3">
						<Label>Job type</Label>
						<div className="flex items-center rounded-md border w-fit">
							<button
								type="button"
								className={`px-4 py-2 text-sm font-medium rounded-l-md transition-colors ${jobType === "one_off" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
								onClick={() => setJobType("one_off")}
							>
								One-off
							</button>
							<button
								type="button"
								className={`px-4 py-2 text-sm font-medium rounded-r-md transition-colors ${jobType === "recurring" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
								onClick={() => setJobType("recurring")}
							>
								Recurring
							</button>
						</div>
					</div>

					{/* Schedule */}
					<Card>
						<CardHeader className="pb-3">
							<CardTitle className="text-lg font-medium">Schedule</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							{/* Visit summary */}
							<div className="flex items-center gap-6 text-sm">
								<div>
									<span className="text-muted-foreground">Total visits </span>
									<span className="font-semibold">{totalVisits}</span>
								</div>
								{jobType === "one_off" ? (
									<div>
										<span className="text-muted-foreground">On </span>
										<span className="font-semibold">{formatDisplayDate(startDate)}</span>
									</div>
								) : (
									<>
										<div>
											<span className="text-muted-foreground">First </span>
											<span className="font-semibold">{formatDisplayDate(startDate)}</span>
										</div>
										{lastDate && (
											<div>
												<span className="text-muted-foreground">Last </span>
												<span className="font-semibold">{formatDisplayDate(lastDate)}</span>
											</div>
										)}
									</>
								)}
							</div>

							{/* Repeats (recurring only) */}
							{jobType === "recurring" && (
								<div className="flex items-center gap-2 text-sm">
									<span className="text-muted-foreground">Repeats</span>
									<Select value={repeats} onValueChange={setRepeats}>
										<SelectTrigger className="w-32 h-8">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="weekly">weekly</SelectItem>
											<SelectItem value="biweekly">biweekly</SelectItem>
											<SelectItem value="monthly">monthly</SelectItem>
										</SelectContent>
									</Select>
									{(repeats === "weekly" || repeats === "biweekly") && (
										<>
											<span className="text-muted-foreground">on</span>
											<div className="flex items-center gap-1">
												{DAYS.map((day) => (
													<button
														key={day}
														type="button"
														className={`h-8 w-8 rounded-full text-xs font-medium transition-colors ${
															repeatDays.includes(day)
																? "bg-primary text-primary-foreground"
																: "border hover:bg-muted"
														}`}
														onClick={() => toggleDay(day)}
													>
														{day.charAt(0)}
													</button>
												))}
											</div>
										</>
									)}
								</div>
							)}

							{/* Date & Time */}
							<div className="grid grid-cols-3 gap-4">
								<div className="space-y-2">
									<Label className="text-sm">Start date</Label>
									<Input
										type="date"
										value={startDate}
										onChange={(e) => setStartDate(e.target.value)}
									/>
								</div>
								<div className="space-y-2">
									<Label className="text-sm">Start time</Label>
									<Input
										type="time"
										value={startTime}
										onChange={(e) => setStartTime(e.target.value)}
									/>
								</div>
								<div className="space-y-2">
									<Label className="text-sm">End time</Label>
									<Input
										type="time"
										value={endTime}
										onChange={(e) => setEndTime(e.target.value)}
									/>
								</div>
							</div>

							{/* Recurring: Repeats & Ends */}
							{jobType === "recurring" && (
								<>
									<div className="space-y-2">
										<Label className="text-sm">Repeats</Label>
										<Select value={repeats} onValueChange={setRepeats}>
											<SelectTrigger className="w-full">
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="weekly">Weekly</SelectItem>
												<SelectItem value="biweekly">Biweekly</SelectItem>
												<SelectItem value="monthly">Monthly</SelectItem>
											</SelectContent>
										</Select>
									</div>
									<div className="grid grid-cols-2 gap-4">
										<div className="space-y-2">
											<Label className="text-sm">Ends after</Label>
											<div className="flex items-center gap-2">
												<button
													type="button"
													className={`px-3 py-1.5 text-sm font-medium rounded-l-md border transition-colors ${endsType === "after" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
													onClick={() => setEndsType("after")}
												>
													Ends after
												</button>
												<button
													type="button"
													className={`px-3 py-1.5 text-sm font-medium rounded-r-md border transition-colors ${endsType === "on" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
													onClick={() => setEndsType("on")}
												>
													Ends on
												</button>
											</div>
										</div>
										<div className="space-y-2">
											{endsType === "after" ? (
												<>
													<Label className="text-sm">Number of visits</Label>
													<Input
														type="number"
														min={1}
														value={endsAfterVisits}
														onChange={(e) => setEndsAfterVisits(e.target.value)}
													/>
												</>
											) : (
												<>
													<Label className="text-sm">End date</Label>
													<Input
														type="date"
														value={endsOnDate}
														onChange={(e) => setEndsOnDate(e.target.value)}
													/>
												</>
											)}
										</div>
									</div>
								</>
							)}

							{/* Visit instructions */}
							<div className="space-y-2">
								<Label className="text-sm">Visit instructions</Label>
								<Textarea
									placeholder="Add instructions for this visit..."
									rows={2}
									value={visitInstructions}
									onChange={(e) => setVisitInstructions(e.target.value)}
								/>
							</div>
						</CardContent>
					</Card>

					{/* Job Forms placeholder */}
					<div className="space-y-2">
						<Label className="font-medium">Add a job form</Label>
						<p className="text-sm text-muted-foreground">
							Attach custom-built forms to your jobs so that nothing gets missed.
						</p>
						<Button type="button" variant="link" size="sm" className="h-auto p-0 text-sm underline">
							Create a job form in Settings
						</Button>
					</div>

					{/* Billing (recurring only) */}
					{jobType === "recurring" && (
						<Card>
							<CardHeader className="pb-3">
								<CardTitle className="text-lg font-medium">Billing &amp; automatic payments</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								{/* Invoice summary */}
								<div className="flex items-center gap-6 text-sm">
									<div>
										<span className="text-muted-foreground">Total invoices </span>
										<span className="font-semibold">{totalInvoices}</span>
									</div>
									{totalInvoices > 0 && (
										<>
											<div>
												<span className="text-muted-foreground">First </span>
												<span className="font-semibold">
													{(() => {
														const d = new Date(startDate);
														d.setMonth(d.getMonth() + 1);
														d.setDate(0); // last day of month
														return formatDisplayDate(d.toISOString().slice(0, 10));
													})()}
												</span>
											</div>
											{lastDate && (
												<div>
													<span className="text-muted-foreground">Last </span>
													<span className="font-semibold">
														{(() => {
															const d = new Date(lastDate);
															d.setMonth(d.getMonth() + 1);
															d.setDate(0);
															return formatDisplayDate(d.toISOString().slice(0, 10));
														})()}
													</span>
												</div>
											)}
										</>
									)}
								</div>

								{/* Billing type */}
								<div className="space-y-2">
									<Label className="text-sm">Billing type</Label>
									<div className="space-y-3">
										<label className="flex items-start gap-3 cursor-pointer">
											<input
												type="radio"
												name="billingType"
												checked={billingType === "visit_based"}
												onChange={() => setBillingType("visit_based")}
												className="mt-1"
											/>
											<div>
												<span className="text-sm font-medium">Visit based</span>
												<p className="text-xs text-muted-foreground">Visits will be listed as a billable item and grouped on one invoice.</p>
											</div>
										</label>
										<label className="flex items-start gap-3 cursor-pointer">
											<input
												type="radio"
												name="billingType"
												checked={billingType === "fixed_price"}
												onChange={() => setBillingType("fixed_price")}
												className="mt-1"
											/>
											<div>
												<span className="text-sm font-medium">Fixed price</span>
												<p className="text-xs text-muted-foreground">Each invoice is for a set amount.</p>
											</div>
										</label>
									</div>
								</div>

								{/* Invoice frequency */}
								<div className="space-y-2">
									<Label className="text-sm">Invoice frequency</Label>
									<Select value={invoiceFrequency} onValueChange={setInvoiceFrequency}>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="monthly">Monthly</SelectItem>
											<SelectItem value="bimonthly">Bi-monthly</SelectItem>
											<SelectItem value="quarterly">Quarterly</SelectItem>
											<SelectItem value="yearly">Yearly</SelectItem>
										</SelectContent>
									</Select>
								</div>

								{/* Auto pay */}
								<div className="rounded-lg border p-4 space-y-2">
									<Label className="text-sm font-medium">Get paid automatically</Label>
									<p className="text-xs text-muted-foreground">
										Clients are automatically invoiced and charged based on their billing frequency once they save a payment method on file.
									</p>
								</div>
							</CardContent>
						</Card>
					)}

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
												<div className="grid grid-cols-[1fr_80px_100px_100px_80px] gap-3 flex-1">
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
														<Label className="text-xs">Unit cost</Label>
														<Input
															type="number"
															min={0}
															step="0.01"
															value={item.unitCost}
															onChange={(e) => updateLineItem(index, { unitCost: Number(e.target.value) })}
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
							<Button type="button" variant="outline" size="sm" onClick={addLineItem}>
								<Plus className="h-4 w-4 mr-1" />
								Add Line Item
							</Button>

							{/* Totals */}
							<div className="space-y-2 pt-4 border-t">
								<div className="flex items-center justify-between text-sm">
									<span className="text-muted-foreground">Total cost</span>
									<span className="font-medium">${totalCost.toFixed(2)}</span>
								</div>
								<div className="flex items-center justify-between text-sm">
									<span className="text-muted-foreground">Total price</span>
									<span className="font-medium">${totalPrice.toFixed(2)}</span>
								</div>
							</div>
						</CardContent>
					</Card>

					{/* Notes */}
					<div className="space-y-4">
						<div>
							<h3 className="text-lg font-medium">Notes</h3>
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
											onClick={() => setNoteFiles((prev) => prev.filter((_, i) => i !== index))}
										>
											<X className="h-4 w-4" />
										</Button>
									</div>
								))}
							</div>
						)}
					</div>

					{/* Link to related */}
					<div className="space-y-2">
						<Label>Link to related</Label>
						<Select value={relatedObject} onValueChange={setRelatedObject}>
							<SelectTrigger>
								<SelectValue placeholder="Link to object" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="none">None</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</div>
			</StickyFooter.Content>
			<StickyFooter.Bar
				className="max-w-4xl"
				left={
					<Button variant="outline" onClick={() => navigate("/jobs")}>
						Cancel
					</Button>
				}
				right={
					<Button onClick={handleSave} disabled={mutation.isPending}>
						{mutation.isPending ? "Saving..." : "Save Job"}
					</Button>
				}
			/>
		</StickyFooter.Root>

		<CustomFieldDialog
			open={customFieldDialogOpen}
			onOpenChange={setCustomFieldDialogOpen}
			appliesTo="job"
			appliesToLabel="All jobs"
		/>
		</>
	);
};

export default CreateJobPage;
