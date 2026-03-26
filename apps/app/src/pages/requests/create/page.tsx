import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { useNavigate } from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getClients } from "@/pages/clients/api";
import { createRequest } from "../api";
import ImageDropzone, { type UploadedFile } from "@/components/image-dropzone";
import LineItemsCard, { type LineItemUI } from "@/components/line-items-card";
import AssessmentCard, { type AssessmentData } from "@/components/assessment-card";
import { StickyFooter } from "@/components/sticky-footer";
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
import type { CreateRequestForm } from "@repo/zod/request";

const CreateRequestPage = () => {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const [uploadedImages, setUploadedImages] = useState<UploadedFile[]>([]);
	const [lineItems, setLineItems] = useState<LineItemUI[]>([]);
	const [assessment, setAssessment] = useState<AssessmentData>({
		instructions: "",
		startDate: "",
		endDate: "",
		startTime: "",
		endTime: "",
		scheduleLater: false,
		anytime: false,
		teamReminder: "none",
	});

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
			fileIds: [],
			lineItems: [],
		},
	});

	const onSubmit = (data: CreateRequestForm) => {
		mutation.mutate({
			...data,
			assessment,
			fileIds: uploadedImages.map((f) => f.fileId),
			lineItems: lineItems.map((item) => ({
				name: item.name,
				description: item.description || undefined,
				qty: item.qty,
				unitPrice: item.unitPrice,
				imageFileId: item.imageFileId || undefined,
			})),
		});
	};

	const isUploading = lineItems.some((i) => i.imageUploading);

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
				<AssessmentCard value={assessment} onChange={setAssessment} />

				{/* Product / Service */}
				<LineItemsCard items={lineItems} onChange={setLineItems} />

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
