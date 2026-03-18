import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Pencil, Trash2, Loader2 } from "lucide-react";
import { useFormContext } from "react-hook-form";
import type { UpdateQuoteClientMessageForm } from "@repo/zod/quote";

interface ClientMessageCardProps {
	isEdit: boolean;
	onEdit: () => void;
	onCancelEdit: () => void;
	onRemoveSection: () => void;
}

const ClientMessageCard = ({ isEdit, onEdit, onCancelEdit, onRemoveSection }: ClientMessageCardProps) => {
	const { register, formState: { isSubmitting }, watch } = useFormContext<UpdateQuoteClientMessageForm>();
	const message = watch("clientMessage");

	return (
		<div className="rounded-xl px-2 border bg-background">
			<div className="py-4 px-2 flex items-center justify-between">
				<h3 className="text-lg font-medium">Client Message</h3>
				{isEdit ? (
					<Button type="button" variant="ghost" size="sm" className="h-7 text-xs text-destructive" onClick={onRemoveSection} disabled={isSubmitting}>
						<Trash2 className="h-3 w-3 mr-1" />
						Delete
					</Button>
				) : (
					<Button type="button" variant="ghost" size="sm" className="h-7 text-xs" onClick={onEdit}>
						<Pencil className="h-3 w-3 mr-1" />
						Edit
					</Button>
				)}
			</div>
			<div className="px-2 pb-4">
				{isEdit ? (
					<div className="space-y-3">
						<Textarea
							placeholder="Add a message for the client..."
							{...register("clientMessage")}
							rows={6}
							className="resize-none"
							disabled={isSubmitting}
						/>
						<div className="flex justify-end gap-2">
							<Button type="button" variant="outline" size="sm" disabled={isSubmitting} onClick={onCancelEdit}>
								Cancel
							</Button>
							<Button type="submit" size="sm" disabled={isSubmitting}>
								{isSubmitting && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
								Save
							</Button>
						</div>
					</div>
				) : (
					<p className="text-sm text-muted-foreground whitespace-pre-wrap">{message}</p>
				)}
			</div>
		</div>
	);
};

export default ClientMessageCard;
