import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm, FormProvider, useWatch, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createJobSchema, type CreateJobForm } from "@repo/zod/job";
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
import ScheduleCard from "./schedule-card";

interface UploadedFile {
	fileId: string;
	name: string;
}

const CreateJobPage = () => {
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	const requestId = searchParams.get("requestId");
	const quoteId = searchParams.get("quoteId");
	const { data: sourceRequest } = useRequestQuery(requestId);
	const { data: sourceQuote } = useQuoteQuery(quoteId);

	const form = useForm({
		resolver: zodResolver(createJobSchema),
		defaultValues: {
			title: "",
			clientId: "",
			jobNumber: "1",
			salesperson: "",
			jobType: "one_off",
			startDate: new Date().toISOString().slice(0, 10),
			startTime: "",
			endTime: "",
			scheduleLater: false,
			anytime: false,
			repeats: "weekly",
			repeatDay: "Wed",
			endsType: "after",
			endsAfterValue: "6",
			endsAfterUnit: "months",
			endsOnDate: "",
			emailTeamAboutAssignment: false,
			visitInstructions: "",
			billingType: "visit_based",
			invoiceFrequency: "monthly",
			lineItems: [],
			notes: "",
			noteFileIds: [],
		},
	});

	const { register, control, handleSubmit, setValue, formState: { isSubmitting } } = form;

	const jobType = useWatch({ control, name: "jobType" });
	const billingType = useWatch({ control, name: "billingType" });
	const invoiceFrequency = useWatch({ control, name: "invoiceFrequency" });
	const startDate = useWatch({ control, name: "startDate" });

	const { fields: lineItems, append: addLineItem, remove: removeLineItem } = useFieldArray({
		control,
		name: "lineItems",
	});

	const [customFieldDialogOpen, setCustomFieldDialogOpen] = useState(false);
	const [noteFiles, setNoteFiles] = useState<UploadedFile[]>([]);
	const [uploadingNotes, setUploadingNotes] = useState(false);

	// Pre-fill from request or quote
	useEffect(() => {
		const source = sourceRequest ?? sourceQuote;
		if (!source) return;
		setValue("title", source.title);
		setValue("clientId", source.clientId);
		if (source.lineItems.length > 0) {
			setValue("lineItems", source.lineItems.map((item) => ({
				name: item.name,
				description: item.description ?? "",
				qty: item.qty,
				unitCost: 0,
				unitPrice: Number(item.unitPrice),
			})));
		}
	}, [sourceRequest, sourceQuote, setValue]);

	const { data: clients } = useQuery({
		queryKey: ["clients"],
		queryFn: getClients,
	});

	// Computed totals
	const watchedLineItems = useWatch({ control, name: "lineItems" });
	const totalCost = (watchedLineItems ?? []).reduce((sum, item) => sum + (item.qty ?? 0) * (item.unitCost ?? 0), 0);
	const totalPrice = (watchedLineItems ?? []).reduce((sum, item) => sum + (item.qty ?? 0) * (item.unitPrice ?? 0), 0);

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
		onSuccess: () => navigate("/jobs"),
	});

	const onSubmit = handleSubmit((data) => {
		mutation.mutate({
			...data,
			noteFileIds: noteFiles.map((f) => f.fileId),
			relatedRequestId: requestId || undefined,
			relatedQuoteId: quoteId || undefined,
		} as CreateJobForm);
	});

	const formatDisplayDate = (dateStr: string) => {
		if (!dateStr) return "";
		const d = new Date(dateStr + "T00:00:00");
		return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
	};

	// Billing computations (recurring only)
	const lastDate = useWatch({ control, name: "endsOnDate" });
	const totalInvoices = (() => {
		if (jobType !== "recurring" || !startDate) return 0;
		const end = lastDate || "";
		if (!end) return 0;
		const diffDays = Math.ceil((new Date(end).getTime() - new Date(startDate).getTime()) / 86400000);
		if (invoiceFrequency === "monthly") return Math.ceil(diffDays / 30) || 1;
		if (invoiceFrequency === "bimonthly") return Math.ceil(diffDays / 60) || 1;
		if (invoiceFrequency === "quarterly") return Math.ceil(diffDays / 90) || 1;
		if (invoiceFrequency === "yearly") return Math.ceil(diffDays / 365) || 1;
		return 1;
	})();

	return (
		<FormProvider {...form}>
			<form onSubmit={onSubmit}>
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
										{...register("title")}
									/>
								</div>
								<div className="space-y-2">
									<Label>Client</Label>
									<Select value={useWatch({ control, name: "clientId" })} onValueChange={(v) => setValue("clientId", v)}>
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
									<Input id="jobNumber" {...register("jobNumber")} />
								</div>
								<div className="space-y-2">
									<Label>Salesperson</Label>
									<Select value={useWatch({ control, name: "salesperson" }) ?? ""} onValueChange={(v) => setValue("salesperson", v)}>
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
							<div className="flex flex-col gap-2">
								<Button type="button" variant="outline" size="sm" className="w-fit" onClick={() => setCustomFieldDialogOpen(true)}>
									Add field
								</Button>
							</div>

							{/* Schedule Card */}
							<ScheduleCard />

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
										<div className="flex items-center gap-6 text-sm">
											<div>
												<span className="text-muted-foreground">Total invoices </span>
												<span className="font-semibold">{totalInvoices}</span>
											</div>
											{totalInvoices > 0 && startDate && (
												<div>
													<span className="text-muted-foreground">First </span>
													<span className="font-semibold">
														{(() => {
															const d = new Date(startDate);
															d.setMonth(d.getMonth() + 1);
															d.setDate(0);
															return formatDisplayDate(d.toISOString().slice(0, 10));
														})()}
													</span>
												</div>
											)}
										</div>

										<div className="space-y-2">
											<Label className="text-sm">Billing type</Label>
											<div className="space-y-3">
												<label className="flex items-start gap-3 cursor-pointer">
													<input type="radio" checked={billingType === "visit_based"} onChange={() => setValue("billingType", "visit_based")} className="mt-1" />
													<div>
														<span className="text-sm font-medium">Visit based</span>
														<p className="text-xs text-muted-foreground">Visits will be listed as a billable item and grouped on one invoice.</p>
													</div>
												</label>
												<label className="flex items-start gap-3 cursor-pointer">
													<input type="radio" checked={billingType === "fixed_price"} onChange={() => setValue("billingType", "fixed_price")} className="mt-1" />
													<div>
														<span className="text-sm font-medium">Fixed price</span>
														<p className="text-xs text-muted-foreground">Each invoice is for a set amount.</p>
													</div>
												</label>
											</div>
										</div>

										<div className="space-y-2">
											<Label className="text-sm">Invoice frequency</Label>
											<Select value={invoiceFrequency ?? "monthly"} onValueChange={(v) => setValue("invoiceFrequency", v)}>
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
											{lineItems.map((field, index) => (
												<div key={field.id} className="rounded-lg border p-4 space-y-3">
													<div className="flex items-start gap-3">
														<div className="grid grid-cols-[1fr_80px_100px_100px_80px] gap-3 flex-1">
															<div className="space-y-1">
																<Label className="text-xs">Name</Label>
																<Input placeholder="Product or service name" {...register(`lineItems.${index}.name`)} />
															</div>
															<div className="space-y-1">
																<Label className="text-xs">Quantity</Label>
																<Input type="number" min={1} {...register(`lineItems.${index}.qty`, { valueAsNumber: true })} />
															</div>
															<div className="space-y-1">
																<Label className="text-xs">Unit cost</Label>
																<Input type="number" min={0} step="0.01" {...register(`lineItems.${index}.unitCost`, { valueAsNumber: true })} />
															</div>
															<div className="space-y-1">
																<Label className="text-xs">Unit price</Label>
																<Input type="number" min={0} step="0.01" {...register(`lineItems.${index}.unitPrice`, { valueAsNumber: true })} />
															</div>
															<div className="space-y-1">
																<Label className="text-xs">Total</Label>
																<div className="flex items-center h-9 px-3 text-sm border rounded-md bg-muted/50">
																	${((watchedLineItems?.[index]?.qty ?? 0) * (watchedLineItems?.[index]?.unitPrice ?? 0)).toFixed(2)}
																</div>
															</div>
														</div>
														<Button type="button" variant="ghost" size="icon" className="mt-5 h-9 w-9 shrink-0" onClick={() => removeLineItem(index)}>
															<X className="h-4 w-4" />
														</Button>
													</div>
													<div className="space-y-1">
														<Label className="text-xs">Description</Label>
														<Textarea placeholder="Line item description" rows={2} {...register(`lineItems.${index}.description`)} />
													</div>
												</div>
											))}
										</div>
									)}
									<Button type="button" variant="outline" size="sm" onClick={() => addLineItem({ name: "", description: "", qty: 1, unitCost: 0, unitPrice: 0 })}>
										<Plus className="h-4 w-4 mr-1" />
										Add Line Item
									</Button>
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
								<h3 className="text-lg font-medium">Notes</h3>
								<Textarea placeholder="Leave a note..." rows={4} {...register("notes")} />
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
											<div key={file.fileId} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
												<span className="truncate">{file.name}</span>
												<Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => setNoteFiles((prev) => prev.filter((_, i) => i !== index))}>
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
								<Select>
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
							<Button type="button" variant="outline" onClick={() => navigate("/jobs")}>
								Cancel
							</Button>
						}
						right={
							<Button type="submit" disabled={mutation.isPending || isSubmitting}>
								{mutation.isPending ? "Saving..." : "Save Job"}
							</Button>
						}
					/>
				</StickyFooter.Root>
			</form>

			<CustomFieldDialog
				open={customFieldDialogOpen}
				onOpenChange={setCustomFieldDialogOpen}
				appliesTo="job"
			/>
		</FormProvider>
	);
};

export default CreateJobPage;
