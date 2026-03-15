import { formatCurrency } from "@/lib/format";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { ImageIcon } from "lucide-react";

interface LineItem {
	id: string;
	name: string;
	description: string | null;
	qty: number;
	unitPrice: string | number;
	imageFileId: string | null;
}

interface LineItemsViewProps {
	items: LineItem[];
	discount?: number;
	tax?: number;
}

const LineItemsView = ({ items, discount, tax }: LineItemsViewProps) => {
	const subtotal = items.reduce((sum, item) => sum + item.qty * Number(item.unitPrice), 0);
	const total = subtotal - (discount ?? 0) + (tax ?? 0);

	return (
		<>
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead className="text-xs">Line Item</TableHead>
						<TableHead className="text-xs text-right w-20">Quantity</TableHead>
						<TableHead className="text-xs text-right w-24">Unit Price</TableHead>
						<TableHead className="text-xs text-right w-24">Total</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{items.map((item) => {
						const itemTotal = item.qty * Number(item.unitPrice);
						return (
							<TableRow key={item.id}>
								<TableCell>
									<div className="flex items-center gap-3">
										{item.imageFileId && (
											<div className="h-9 w-9 rounded bg-muted flex items-center justify-center shrink-0">
												<ImageIcon className="h-4 w-4 text-muted-foreground" />
											</div>
										)}
										<div>
											<p className="text-sm font-medium">{item.name}</p>
											{item.description && (
												<p className="text-xs text-muted-foreground">{item.description}</p>
											)}
										</div>
									</div>
								</TableCell>
								<TableCell className="text-sm text-right">{item.qty}</TableCell>
								<TableCell className="text-sm text-right">
									{formatCurrency(Number(item.unitPrice))}
								</TableCell>
								<TableCell className="text-sm text-right font-medium">
									{formatCurrency(itemTotal)}
								</TableCell>
							</TableRow>
						);
					})}
				</TableBody>
			</Table>
			<div className="mt-3 pt-3 border-t space-y-1.5">
				<div className="flex justify-between text-sm">
					<span className="text-muted-foreground">Subtotal</span>
					<span>{formatCurrency(subtotal)}</span>
				</div>
				{(discount ?? 0) > 0 && (
					<div className="flex justify-between text-sm">
						<span className="text-muted-foreground">Discount</span>
						<span className="text-red-600">-{formatCurrency(discount!)}</span>
					</div>
				)}
				{(tax ?? 0) > 0 && (
					<div className="flex justify-between text-sm">
						<span className="text-muted-foreground">Tax</span>
						<span>{formatCurrency(tax!)}</span>
					</div>
				)}
				<div className={`flex justify-between text-sm font-semibold ${(discount ?? 0) > 0 || (tax ?? 0) > 0 ? "pt-1.5 border-t" : ""}`}>
					<span>Total</span>
					<span>{formatCurrency(total)}</span>
				</div>
			</div>
		</>
	);
};

export default LineItemsView;
