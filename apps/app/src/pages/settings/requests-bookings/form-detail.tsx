import { useParams, useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	ArrowLeft,
	GripVertical,
	MoreHorizontal,
	Columns2,
	AlignLeft,
	AlignJustify,
	ChevronDown,
	ListChecks,
	CheckSquare,
	CircleDot,
	Hash,
	ImageUp,
	ToggleLeft,
	CalendarDays,
	Ruler,
	MapPin,
	Building2,
	Mail,
	Phone,
	UserSearch,
	ShoppingCart,
	Plus,
} from "lucide-react";
import { getRequestForms } from "../api";

const FormDetailPage = () => {
	const { formId } = useParams();
	const navigate = useNavigate();

	const { data: forms = [] } = useQuery({
		queryKey: ["request-forms"],
		queryFn: getRequestForms,
	});

	const form = forms.find((f) => f.id === formId);

	return (
		<div className="min-h-screen flex flex-col">
			{/* Header bar */}
			<header className="h-14 border-b flex items-center justify-between px-4 shrink-0">
				<div className="flex items-center gap-3">
					<Button variant="ghost" size="sm" onClick={() => navigate("/settings/requests-bookings")}>
						<ArrowLeft className="size-4" />
					</Button>
					<h1 className="text-lg font-semibold">{form?.name ?? "Form Details"}</h1>
				</div>
				<div className="flex items-center gap-2">
					<Button variant="outline" size="sm" onClick={() => navigate("/settings/requests-bookings")}>
						Cancel
					</Button>
					<Button size="sm">Save</Button>
				</div>
			</header>

			{/* Canvas area */}
			<div className="flex-1 flex gap-4 p-4 overflow-hidden">
				{/* Left card - Form preview */}
				<div className="flex-1 rounded-lg border bg-card p-8 overflow-y-auto">
					<div className="max-w-xl mx-auto space-y-4">
						{/* Contact Information Section */}
						<div className="rounded-lg border p-6 space-y-6 relative">
							<div className="flex justify-center -mt-3">
								<GripVertical className="size-5 text-muted-foreground/50 rotate-90 cursor-grab" />
							</div>
							<div className="flex items-center justify-between">
								<h3 className="text-lg font-semibold">Contact information</h3>
								<Button variant="ghost" size="sm" className="size-8 p-0">
									<MoreHorizontal className="size-4" />
								</Button>
							</div>

							{/* First name + Last name (grouped) */}
							<div className="flex items-start gap-2">
								<div className="flex-1 grid grid-cols-2 gap-4">
									<div className="space-y-2">
										<Label>First name</Label>
										<Input placeholder="First name" disabled />
									</div>
									<div className="space-y-2">
										<Label>Last name</Label>
										<Input placeholder="Last name" disabled />
									</div>
								</div>
								<GripVertical className="size-5 text-muted-foreground/50 cursor-grab mt-8 shrink-0" />
							</div>

							{/* Company name */}
							<div className="flex items-start gap-2">
								<div className="flex-1 space-y-2">
									<Label>Company name</Label>
									<Input placeholder="Company name" disabled />
								</div>
								<GripVertical className="size-5 text-muted-foreground/50 cursor-grab mt-8 shrink-0" />
							</div>

							{/* Email */}
							<div className="flex items-start gap-2">
								<div className="flex-1 space-y-2">
									<Label>Email</Label>
									<Input type="email" placeholder="Email" disabled />
								</div>
								<GripVertical className="size-5 text-muted-foreground/50 cursor-grab mt-8 shrink-0" />
							</div>

							{/* Phone */}
							<div className="flex items-start gap-2">
								<div className="flex-1 space-y-2">
									<Label>Phone</Label>
									<Input placeholder="(___) ___-____" disabled />
									<p className="text-xs text-muted-foreground">
										By providing your phone number, you agree to receive Visit Reminders and other
										transactional text messages (SMS). You can unsubscribe at anytime by replying STOP.
										Message and data rates may apply. Message frequency varies. Reply HELP for help or
										STOP to cancel.
									</p>
								</div>
								<GripVertical className="size-5 text-muted-foreground/50 cursor-grab mt-8 shrink-0" />
							</div>

							{/* Street Address */}
							<div className="flex items-start gap-2">
								<div className="flex-1 space-y-4">
									<Label className="text-base font-medium">Street address</Label>
									<div className="space-y-4">
										<Input placeholder="Street address" disabled />
										<Input placeholder="Unit, apartment, suite, etc. (optional)" disabled />
										<div className="space-y-2">
											<Label>City</Label>
											<Input placeholder="City" disabled />
										</div>
										<div className="grid grid-cols-2 gap-4">
											<div className="space-y-2">
												<Label>State</Label>
												<Select disabled>
													<SelectTrigger>
														<SelectValue placeholder="Choose an option" />
													</SelectTrigger>
													<SelectContent>
														<SelectItem value="AL">Alabama</SelectItem>
													</SelectContent>
												</Select>
											</div>
											<div className="space-y-2">
												<Label>ZIP Code</Label>
												<Input placeholder="ZIP Code" disabled />
											</div>
										</div>
									</div>
								</div>
								<GripVertical className="size-5 text-muted-foreground/50 cursor-grab mt-8 shrink-0" />
							</div>
						</div>

						{/* Service Details Section */}
						<div className="rounded-lg border p-6 space-y-6 relative">
							<div className="flex justify-center -mt-3">
								<GripVertical className="size-5 text-muted-foreground/50 rotate-90 cursor-grab" />
							</div>
							<div className="flex items-center justify-between">
								<h3 className="text-lg font-semibold">Service details</h3>
								<Button variant="ghost" size="sm" className="size-8 p-0">
									<MoreHorizontal className="size-4" />
								</Button>
							</div>

							{/* Long answer - description */}
							<div className="space-y-2">
								<div className="flex items-center justify-between">
									<Label>Please provide as much information as you can</Label>
									<GripVertical className="size-4 text-muted-foreground/50 cursor-grab" />
								</div>
								<Textarea placeholder="" disabled rows={4} />
								<p className="text-xs text-muted-foreground">Required</p>
							</div>

							{/* Image upload */}
							<div className="space-y-2">
								<div className="flex items-center justify-between">
									<Label>Share images of the work to be done</Label>
									<GripVertical className="size-4 text-muted-foreground/50 cursor-grab" />
								</div>
								<div className="rounded-lg border-2 border-dashed p-8 flex flex-col items-center gap-2">
									<Button variant="outline" size="sm" disabled>
										Select Images
									</Button>
									<p className="text-sm text-muted-foreground">Select or drag a file here to upload</p>
									<p className="text-xs text-muted-foreground">Up to 50MB each</p>
								</div>
							</div>

							{/* Lead source dropdown */}
							<div className="space-y-2">
								<div className="flex items-center justify-between">
									<Label>How did you hear about us?</Label>
									<GripVertical className="size-4 text-muted-foreground/50 cursor-grab" />
								</div>
								<Select disabled>
									<SelectTrigger>
										<SelectValue placeholder="Choose an option" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="existing_client">Existing Client</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</div>
					</div>
				</div>

				{/* Right card */}
				<div className="w-[30%] shrink-0 rounded-lg border bg-card p-6">
					<h2 className="text-lg font-semibold mb-4">Manage form</h2>
					<Tabs defaultValue="questions">
						<TabsList className="w-full mb-4">
							<TabsTrigger value="questions" className="flex-1">Add Questions</TabsTrigger>
							<TabsTrigger value="settings" className="flex-1">Settings</TabsTrigger>
						</TabsList>
						<TabsContent value="questions" className="space-y-6 overflow-y-auto max-h-[calc(100vh-14rem)]">
							{/* Layout options */}
							<div className="space-y-2">
								<p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Layout options</p>
								<button className="flex items-center gap-3 w-full rounded-md px-3 py-2 text-sm hover:bg-accent transition-colors text-left">
									<Plus className="size-4 text-muted-foreground" />
									<span>Add section</span>
								</button>
							</div>

							{/* Custom questions */}
							<div className="space-y-2">
								<p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Custom questions</p>
								<p className="text-xs text-muted-foreground">Select the type of question you'd like to ask</p>
								<div className="space-y-0.5">
									<button className="flex items-center gap-3 w-full rounded-md px-3 py-2 text-sm hover:bg-accent transition-colors text-left">
										<AlignLeft className="size-4 text-muted-foreground" />
										<span>Short answer</span>
									</button>
									<button className="flex items-center gap-3 w-full rounded-md px-3 py-2 text-sm hover:bg-accent transition-colors text-left">
										<AlignJustify className="size-4 text-muted-foreground" />
										<span>Long answer</span>
									</button>
									<button className="flex items-center gap-3 w-full rounded-md px-3 py-2 text-sm hover:bg-accent transition-colors text-left">
										<ListChecks className="size-4 text-muted-foreground" />
										<span>Dropdown (multi choice)</span>
									</button>
									<button className="flex items-center gap-3 w-full rounded-md px-3 py-2 text-sm hover:bg-accent transition-colors text-left">
										<ChevronDown className="size-4 text-muted-foreground" />
										<span>Dropdown (single choice)</span>
									</button>
									<button className="flex items-center gap-3 w-full rounded-md px-3 py-2 text-sm hover:bg-accent transition-colors text-left">
										<CheckSquare className="size-4 text-muted-foreground" />
										<span>Checkbox</span>
									</button>
									<button className="flex items-center gap-3 w-full rounded-md px-3 py-2 text-sm hover:bg-accent transition-colors text-left">
										<CircleDot className="size-4 text-muted-foreground" />
										<span>Radio button (single choice)</span>
									</button>
									<button className="flex items-center gap-3 w-full rounded-md px-3 py-2 text-sm hover:bg-accent transition-colors text-left">
										<Hash className="size-4 text-muted-foreground" />
										<span>Numerical answer</span>
									</button>
									<button className="flex items-center gap-3 w-full rounded-md px-3 py-2 text-sm hover:bg-accent transition-colors text-left">
										<ImageUp className="size-4 text-muted-foreground" />
										<span>Upload images</span>
									</button>
									<button className="flex items-center gap-3 w-full rounded-md px-3 py-2 text-sm hover:bg-accent transition-colors text-left">
										<ToggleLeft className="size-4 text-muted-foreground" />
										<span>Yes/No toggle</span>
									</button>
									<button className="flex items-center gap-3 w-full rounded-md px-3 py-2 text-sm hover:bg-accent transition-colors text-left">
										<CalendarDays className="size-4 text-muted-foreground" />
										<span>Date picker</span>
									</button>
									<button className="flex items-center gap-3 w-full rounded-md px-3 py-2 text-sm hover:bg-accent transition-colors text-left">
										<Ruler className="size-4 text-muted-foreground" />
										<span>Area</span>
									</button>
								</div>
							</div>

							{/* Standardized questions */}
							<div className="space-y-2">
								<p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Standardized questions</p>
								<div className="space-y-0.5">
									<button className="flex items-center gap-3 w-full rounded-md px-3 py-2 text-sm hover:bg-accent transition-colors text-left">
										<MapPin className="size-4 text-muted-foreground" />
										<span>Address</span>
									</button>
									<button className="flex items-center gap-3 w-full rounded-md px-3 py-2 text-sm hover:bg-accent transition-colors text-left">
										<Building2 className="size-4 text-muted-foreground" />
										<span>Company name</span>
									</button>
									<button className="flex items-center gap-3 w-full rounded-md px-3 py-2 text-sm hover:bg-accent transition-colors text-left">
										<Mail className="size-4 text-muted-foreground" />
										<span>Email</span>
									</button>
									<button className="flex items-center gap-3 w-full rounded-md px-3 py-2 text-sm hover:bg-accent transition-colors text-left">
										<Phone className="size-4 text-muted-foreground" />
										<span>Phone number</span>
									</button>
									<button className="flex items-center gap-3 w-full rounded-md px-3 py-2 text-sm hover:bg-accent transition-colors text-left">
										<UserSearch className="size-4 text-muted-foreground" />
										<span>Lead source</span>
									</button>
								</div>
							</div>

							{/* Actions */}
							<div className="space-y-2">
								<p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</p>
								<div className="space-y-0.5">
									<button className="flex items-center gap-3 w-full rounded-md px-3 py-2 text-sm hover:bg-accent transition-colors text-left">
										<ShoppingCart className="size-4 text-muted-foreground" />
										<span>Add products and services</span>
									</button>
								</div>
							</div>
						</TabsContent>
						<TabsContent value="settings" className="space-y-4">
							<div className="space-y-2">
								<Label htmlFor="formTitle">Form title</Label>
								<Input id="formTitle" placeholder="Enter form title" defaultValue={form?.name ?? ""} />
							</div>
							<div className="space-y-2">
								<Label htmlFor="formDesc">Form description</Label>
								<Textarea id="formDesc" placeholder="Enter form description" defaultValue={form?.description ?? ""} />
							</div>
						</TabsContent>
					</Tabs>
				</div>
			</div>
		</div>
	);
};

export default FormDetailPage;
