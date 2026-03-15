import { presignUpload, uploadFileToS3 } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { X, Plus, Loader2 } from "lucide-react";

export interface LineItemUI {
	name: string;
	description: string;
	qty: number;
	unitPrice: number;
	imageFileId: string | null;
	imagePreview: string | null;
	imageUploading: boolean;
}

export function createEmptyLineItem(): LineItemUI {
	return { name: "", description: "", qty: 1, unitPrice: 0, imageFileId: null, imagePreview: null, imageUploading: false };
}

interface LineItemsCardProps {
	items: LineItemUI[];
	onChange: (items: LineItemUI[]) => void;
	onSave?: () => void;
	onCancel?: () => void;
	saving?: boolean;
	hideHeader?: boolean;
}

const LineItemsCard = ({ items, onChange, onSave, onCancel, saving, hideHeader }: LineItemsCardProps) => {
	const updateItem = (index: number, updates: Partial<LineItemUI>) => {
		onChange(items.map((item, i) => (i === index ? { ...item, ...updates } : item)));
	};

	const removeItem = (index: number) => {
		onChange(items.filter((_, i) => i !== index));
	};

	const handleImage = async (index: number, file: File) => {
		updateItem(index, { imageUploading: true });
		try {
			const { fileId, uploadUrl } = await presignUpload(file.name, file.type);
			await uploadFileToS3(uploadUrl, file);
			updateItem(index, { imageFileId: fileId, imagePreview: URL.createObjectURL(file), imageUploading: false });
		} catch {
			updateItem(index, { imageUploading: false });
		}
	};

	const subtotal = items.reduce((sum, item) => sum + item.qty * item.unitPrice, 0);

	const content = (
			<div className={hideHeader ? "space-y-4" : "px-2 pb-4 space-y-4"}>
				{items.length > 0 && (
					<div className="space-y-4">
						{items.map((item, index) => (
							<div key={index} className="rounded-lg border p-4 space-y-3">
								<div className="flex items-start gap-3">
									<div className="grid grid-cols-[1fr_80px_100px_80px] gap-3 flex-1">
										<div className="space-y-1">
											<Label className="text-xs">Name</Label>
											<Input
												placeholder="Product or service name"
												value={item.name}
												onChange={(e) => updateItem(index, { name: e.target.value })}
											/>
										</div>
										<div className="space-y-1">
											<Label className="text-xs">Qty</Label>
											<Input
												type="number"
												min={1}
												value={item.qty}
												onChange={(e) => updateItem(index, { qty: Number(e.target.value) })}
											/>
										</div>
										<div className="space-y-1">
											<Label className="text-xs">Unit Price</Label>
											<Input
												type="number"
												min={0}
												step="0.01"
												value={item.unitPrice}
												onChange={(e) => updateItem(index, { unitPrice: Number(e.target.value) })}
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
										onClick={() => removeItem(index)}
									>
										<X className="h-4 w-4" />
									</Button>
								</div>
								<div className="grid grid-cols-[1fr_auto] gap-3">
									<div className="space-y-1">
										<Label className="text-xs">Description</Label>
										<Textarea
											placeholder="Line item description"
											rows={2}
											value={item.description}
											onChange={(e) => updateItem(index, { description: e.target.value })}
										/>
									</div>
									<div className="self-end">
										<Label className="text-xs mb-1 block">Image</Label>
										{item.imageUploading ? (
											<div className="flex items-center justify-center h-15 w-15 rounded border">
												<Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
											</div>
										) : item.imagePreview ? (
											<div className="relative group h-15 w-15">
												<img src={item.imagePreview} alt="" className="h-full w-full rounded object-cover border" />
												<Button
													type="button"
													variant="destructive"
													size="icon"
													className="absolute -top-1 -right-1 h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity"
													onClick={() => updateItem(index, { imageFileId: null, imagePreview: null })}
												>
													<X className="h-2.5 w-2.5" />
												</Button>
											</div>
										) : (
											<label className="flex items-center justify-center h-15 w-15 rounded border border-dashed cursor-pointer hover:bg-muted/50 transition-colors">
												<Plus className="h-4 w-4 text-muted-foreground" />
												<input
													type="file"
													accept="image/*"
													className="hidden"
													onChange={(e) => {
														const file = e.target.files?.[0];
														if (file) handleImage(index, file);
													}}
												/>
											</label>
										)}
									</div>
								</div>
							</div>
						))}
					</div>
				)}
				<Button type="button" variant="outline" size="sm" onClick={() => onChange([...items, createEmptyLineItem()])}>
					<Plus className="h-4 w-4 mr-1" />
					Add Line Item
				</Button>
				<div className="space-y-2 pt-2 border-t">
					<div className="flex items-center justify-between">
						<span className="text-sm text-muted-foreground">Subtotal</span>
						<span className="text-sm">${subtotal.toFixed(2)}</span>
					</div>
					<div className="flex items-center justify-between">
						<span className="text-sm font-semibold">Total</span>
						<span className="text-sm font-semibold">${subtotal.toFixed(2)}</span>
					</div>
				</div>
				{onSave && (
					<div className="flex items-center gap-2 pt-4 border-t">
						<Button size="sm" onClick={onSave} disabled={saving}>
							{saving ? "Saving..." : "Save"}
						</Button>
						{onCancel && (
							<Button variant="outline" size="sm" onClick={onCancel}>
								Cancel
							</Button>
						)}
					</div>
				)}
			</div>
	);

	if (hideHeader) return content;

	return (
		<div className="rounded-xl px-2 border bg-background">
			<div className="py-4 px-2">
				<h3 className="text-lg font-medium">Product / Service</h3>
				<p className="text-sm text-muted-foreground">
					Keep everything on track by adding products and services.
				</p>
			</div>
			{content}
		</div>
	);
};

export default LineItemsCard;
