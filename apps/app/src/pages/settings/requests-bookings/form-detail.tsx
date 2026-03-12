import { useParams, useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	ArrowLeft,
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
				{/* Left card */}
				<div className="flex-1 rounded-lg border bg-card p-6">
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
