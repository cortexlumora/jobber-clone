import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { getProductsServices } from "@/pages/settings/api";
import { Search, Plus, ShoppingBag, X } from "lucide-react";
import type { FieldRendererProps } from "./types";

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

export function ProductsServicesField(_props: FieldRendererProps) {
	const [dialogOpen, setDialogOpen] = useState(false);
	const [search, setSearch] = useState("");
	const [selected, setSelected] = useState<ProductService[]>([]);

	const { data } = useQuery({
		queryKey: ["products-services-picker", search],
		queryFn: () => getProductsServices({ search: search || undefined, limit: 50 }),
		enabled: dialogOpen,
	});

	const items: ProductService[] = data?.data ?? [];

	const products = items.filter((i) => i.type === "product");
	const services = items.filter((i) => i.type === "service");

	const handleSelect = (item: ProductService) => {
		if (selected.find((s) => s.id === item.id)) {
			setSelected(selected.filter((s) => s.id !== item.id));
		} else {
			setSelected([...selected, item]);
		}
	};

	const handleRemove = (id: string) => {
		setSelected(selected.filter((s) => s.id !== id));
	};

	const isSelected = (id: string) => selected.some((s) => s.id === id);

	const formatPrice = (price: string) => {
		const num = parseFloat(price);
		if (!num || isNaN(num)) return "$0";
		return `$${num.toFixed(0)}`;
	};

	return (
		<div className="space-y-3">
			{/* Selected items */}
			{selected.length > 0 && (
				<div className="space-y-2">
					{selected.map((item) => (
						<div
							key={item.id}
							className="flex items-center justify-between rounded-lg border p-3"
						>
							<div className="min-w-0">
								<p className="text-sm font-medium truncate">{item.name}</p>
								{item.description && (
									<p className="text-xs text-muted-foreground truncate">{item.description}</p>
								)}
							</div>
							<div className="flex items-center gap-2 shrink-0">
								<span className="text-sm text-muted-foreground">{formatPrice(item.unitPrice)}</span>
								<button
									onClick={() => handleRemove(item.id)}
									className="p-1 text-muted-foreground hover:text-destructive"
								>
									<X className="size-4" />
								</button>
							</div>
						</div>
					))}
				</div>
			)}

			{/* Add button */}
			<Button
				variant="outline"
				size="sm"
				onClick={() => setDialogOpen(true)}
			>
				<Plus className="size-4 mr-1" />
				Add Services
			</Button>

			{/* Picker dialog */}
			<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
				<DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
					<DialogHeader>
						<DialogTitle>Select a Product / Service</DialogTitle>
					</DialogHeader>

					{/* Search */}
					<div className="relative">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
						<Input
							placeholder="Search Products / Services"
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							className="pl-9"
						/>
					</div>

					<p className="text-center text-xs text-muted-foreground">or</p>

					{/* Create new link */}
					<Button
						variant="outline"
						size="sm"
						className="w-full"
						onClick={() => window.open("/settings/products-services", "_blank")}
					>
						<Plus className="size-4 mr-1" />
						Create new
					</Button>

					{/* Items list */}
					<div className="flex-1 overflow-y-auto -mx-6 px-6 space-y-4">
						{services.length > 0 && (
							<div>
								<p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
									Services
								</p>
								<div className="space-y-1">
									{services.map((item) => (
										<button
											key={item.id}
											onClick={() => handleSelect(item)}
											className={`w-full text-left rounded-lg border p-3 transition-colors hover:bg-accent/50 ${
												isSelected(item.id) ? "border-primary bg-primary/5" : ""
											}`}
										>
											<div className="flex items-start justify-between gap-2">
												<div className="min-w-0 flex-1">
													<p className="text-sm font-medium">{item.name}</p>
													{item.description && (
														<p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
															{item.description}
														</p>
													)}
												</div>
												<span className="text-sm font-medium shrink-0">
													{formatPrice(item.unitPrice)}
												</span>
											</div>
										</button>
									))}
								</div>
							</div>
						)}

						{products.length > 0 && (
							<div>
								<p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
									Products
								</p>
								<div className="space-y-1">
									{products.map((item) => (
										<button
											key={item.id}
											onClick={() => handleSelect(item)}
											className={`w-full text-left rounded-lg border p-3 transition-colors hover:bg-accent/50 ${
												isSelected(item.id) ? "border-primary bg-primary/5" : ""
											}`}
										>
											<div className="flex items-start justify-between gap-2">
												<div className="min-w-0 flex-1">
													<p className="text-sm font-medium">{item.name}</p>
													{item.description && (
														<p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
															{item.description}
														</p>
													)}
												</div>
												<span className="text-sm font-medium shrink-0">
													{formatPrice(item.unitPrice)}
												</span>
											</div>
										</button>
									))}
								</div>
							</div>
						)}

						{items.length === 0 && (
							<div className="flex flex-col items-center gap-2 py-8">
								<ShoppingBag className="size-8 text-muted-foreground/50" />
								<p className="text-sm text-muted-foreground">No products or services found</p>
							</div>
						)}
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}
