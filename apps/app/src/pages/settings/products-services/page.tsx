import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from "@/components/ui/dialog";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Search, Plus, X, Upload, Download, ChevronLeft, ChevronRight } from "lucide-react";
import { getProductsServices, createProductService } from "../api";

interface ProductService {
	id: string;
	name: string;
	description: string | null;
	type: string;
	cost: string;
	markup: string;
	unitPrice: string;
	taxExempt: boolean;
	onlineBooking: boolean;
}

interface PaginatedResponse {
	data: ProductService[];
	pagination: {
		total: number;
		page: number;
		limit: number;
		totalPages: number;
	};
}

const defaultFormState = {
	type: "service" as string,
	name: "",
	description: "",
	cost: "",
	markup: "",
	unitPrice: "",
	taxExempt: false,
	onlineBooking: false,
};

const ProductsServicesPage = () => {
	const queryClient = useQueryClient();

	// Search & pagination state
	const [search, setSearch] = useState("");
	const [page, setPage] = useState(1);
	const [limit, setLimit] = useState(25);

	// Dialog state
	const [dialogOpen, setDialogOpen] = useState(false);
	const [form, setForm] = useState(defaultFormState);

	// Costs toggle state
	const [costsEnabled, setCostsEnabled] = useState(false);

	// Query
	const { data } = useQuery<PaginatedResponse>({
		queryKey: ["products-services", search, page, limit],
		queryFn: () => getProductsServices({ search: search || undefined, page, limit }),
	});

	const items = data?.data ?? [];
	const total = data?.pagination?.total ?? 0;
	const totalPages = data?.pagination?.totalPages ?? 1;

	// Mutations
	const createMutation = useMutation({
		mutationFn: createProductService,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["products-services"] });
			setDialogOpen(false);
			setForm(defaultFormState);
		},
	});


	const handleCreate = () => {
		createMutation.mutate(form);
	};

	const startIndex = (page - 1) * limit + 1;
	const endIndex = Math.min(page * limit, total);

	return (
		<div className="max-w-3xl">
			{/* Header */}
			<h2 className="text-2xl font-semibold mb-2">Products & services</h2>
			<p className="text-sm text-muted-foreground mb-6">
				Add and update your products & services to stay organized when creating quotes, quote
				templates, jobs, and invoices.
			</p>

			{/* Search + Add button */}
			<div className="flex items-center gap-3 mb-4">
				<div className="relative flex-1">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
					<Input
						placeholder="Search products & services..."
						value={search}
						onChange={(e) => {
							setSearch(e.target.value);
							setPage(1);
						}}
						className="pl-9 pr-9"
					/>
					{search && (
						<button
							onClick={() => {
								setSearch("");
								setPage(1);
							}}
							className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
						>
							<X className="size-4" />
						</button>
					)}
				</div>
				<Button onClick={() => setDialogOpen(true)}>
					<Plus className="size-4 mr-1" />
					Add Item
				</Button>
			</div>

			{/* Table */}
			<div className="rounded-lg border mb-8">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Name</TableHead>
							<TableHead>Description</TableHead>
							<TableHead>Type</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{items.length === 0 ? (
							<TableRow>
								<TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
									No products or services found.
								</TableCell>
							</TableRow>
						) : (
							items.map((item) => (
								<TableRow key={item.id}>
									<TableCell className="font-medium">{item.name}</TableCell>
									<TableCell className="text-muted-foreground">
										{item.description || "-"}
									</TableCell>
									<TableCell className="capitalize">{item.type}</TableCell>
								</TableRow>
							))
						)}
					</TableBody>
				</Table>

				{/* Table footer */}
				<div className="flex items-center justify-between border-t px-4 py-3">
					<p className="text-sm text-muted-foreground">
						{total > 0
							? `Showing ${startIndex}-${endIndex} of ${total} items`
							: "No items"}
					</p>
					<div className="flex items-center gap-3">
						<div className="flex items-center gap-2">
							<span className="text-sm text-muted-foreground">Per page</span>
							<Select
								value={String(limit)}
								onValueChange={(val) => {
									setLimit(Number(val));
									setPage(1);
								}}
							>
								<SelectTrigger className="w-[70px] h-8">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="10">10</SelectItem>
									<SelectItem value="25">25</SelectItem>
									<SelectItem value="50">50</SelectItem>
									<SelectItem value="100">100</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div className="flex items-center gap-1">
							<Button
								variant="outline"
								size="icon"
								className="size-8"
								disabled={page <= 1}
								onClick={() => setPage((p) => p - 1)}
							>
								<ChevronLeft className="size-4" />
							</Button>
							<Button
								variant="outline"
								size="icon"
								className="size-8"
								disabled={page >= totalPages}
								onClick={() => setPage((p) => p + 1)}
							>
								<ChevronRight className="size-4" />
							</Button>
						</div>
					</div>
				</div>
			</div>

			{/* Costs card */}
			<div className="rounded-lg border p-4 mb-4">
				<div className="flex items-start justify-between">
					<div className="space-y-1">
						<h3 className="text-lg font-medium">Costs</h3>
						<p className="text-sm font-medium text-muted-foreground">
							Product & Services costs
						</p>
						<p className="text-sm text-muted-foreground">
							Add costs to your products and services on quotes and jobs
						</p>
					</div>
					<Switch checked={costsEnabled} onCheckedChange={setCostsEnabled} />
				</div>
			</div>

			{/* Import card */}
			<div className="rounded-lg border p-4 mb-4">
				<div className="flex items-start justify-between">
					<div className="space-y-1">
						<h3 className="text-lg font-medium">Import products & services</h3>
						<p className="text-sm text-muted-foreground">
							Import your products and services from a CSV file. Download the{" "}
							<a href="#" className="text-primary underline">
								sample file
							</a>{" "}
							to see the required format. Visit the{" "}
							<a href="#" className="text-primary underline">
								Help Center
							</a>{" "}
							for more information.
						</p>
					</div>
					<Button variant="outline" className="shrink-0 ml-4">
						<Upload className="size-4 mr-1" />
						Import CSV
					</Button>
				</div>
			</div>

			{/* Export card */}
			<div className="rounded-lg border p-4 mb-8">
				<div className="flex items-start justify-between">
					<div className="space-y-1">
						<h3 className="text-lg font-medium">Export products & services</h3>
						<p className="text-sm text-muted-foreground">
							Export all your products and services to a CSV file. Visit the{" "}
							<a href="#" className="text-primary underline">
								Help Center
							</a>{" "}
							for more information.
						</p>
					</div>
					<Button variant="outline" className="shrink-0 ml-4">
						<Download className="size-4 mr-1" />
						Export CSV
					</Button>
				</div>
			</div>

			{/* Add New Product/Service Dialog */}
			<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
				<DialogContent className="max-w-lg">
					<DialogHeader>
						<DialogTitle>Add New Product/Service</DialogTitle>
					</DialogHeader>
					<div className="space-y-4">
						{/* Item Type */}
						<div className="space-y-2">
							<Label>Item type</Label>
							<Select
								value={form.type}
								onValueChange={(val) => setForm((f) => ({ ...f, type: val }))}
							>
								<SelectTrigger>
									<SelectValue placeholder="Select type" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="service">Service</SelectItem>
									<SelectItem value="product">Product</SelectItem>
								</SelectContent>
							</Select>
						</div>

						{/* Name */}
						<div className="space-y-2">
							<Label htmlFor="ps-name">Name</Label>
							<Input
								id="ps-name"
								placeholder="Enter name"
								value={form.name}
								onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
							/>
						</div>

						{/* Description */}
						<div className="space-y-2">
							<Label htmlFor="ps-description">Description</Label>
							<Textarea
								id="ps-description"
								placeholder="Enter description"
								value={form.description}
								onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
							/>
						</div>

						{/* Cost / Markup / Unit Price */}
						<div className="grid grid-cols-3 gap-3">
							<div className="space-y-2">
								<Label htmlFor="ps-cost">Cost</Label>
								<Input
									id="ps-cost"
									type="number"
									placeholder="0.00"
									value={form.cost}
									onChange={(e) => setForm((f) => ({ ...f, cost: e.target.value }))}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="ps-markup">Markup</Label>
								<Input
									id="ps-markup"
									type="number"
									placeholder="0.00"
									value={form.markup}
									onChange={(e) => setForm((f) => ({ ...f, markup: e.target.value }))}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="ps-unit-price">Unit Price</Label>
								<Input
									id="ps-unit-price"
									type="number"
									placeholder="0.00"
									value={form.unitPrice}
									onChange={(e) => setForm((f) => ({ ...f, unitPrice: e.target.value }))}
								/>
							</div>
						</div>

						{/* Image upload */}
						<div className="space-y-2">
							<Label>Image</Label>
							<div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center gap-2">
								<Button variant="outline" size="sm">
									<Upload className="size-4 mr-1" />
									Upload Image
								</Button>
								<p className="text-xs text-muted-foreground">PNG, JPG up to 5MB</p>
							</div>
						</div>

						{/* Tax exempt */}
						<div className="flex items-center gap-2">
							<Checkbox
								id="ps-tax-exempt"
								checked={form.taxExempt}
								onCheckedChange={(checked) =>
									setForm((f) => ({ ...f, taxExempt: checked === true }))
								}
							/>
							<Label htmlFor="ps-tax-exempt" className="font-normal">
								Exempt from Tax
							</Label>
						</div>

						<Separator />

						{/* Online Booking */}
						<div className="flex items-start justify-between">
							<div className="space-y-1">
								<p className="text-sm font-medium">Online Booking</p>
								<p className="text-sm text-muted-foreground">
									Make this product or service available for customers to book online.
								</p>
							</div>
							<Switch
								checked={form.onlineBooking}
								onCheckedChange={(checked) =>
									setForm((f) => ({ ...f, onlineBooking: checked }))
								}
							/>
						</div>
					</div>

					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => {
								setDialogOpen(false);
								setForm(defaultFormState);
							}}
						>
							Cancel
						</Button>
						<Button onClick={handleCreate} disabled={createMutation.isPending || !form.name}>
							{createMutation.isPending ? "Creating..." : "Create"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
};

export default ProductsServicesPage;
