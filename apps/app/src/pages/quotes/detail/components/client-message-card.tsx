import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { X, Loader2 } from "lucide-react";
import { useFormContext } from "react-hook-form";
import type { UpdateQuoteClientMessageForm } from "@repo/zod/quote";

interface ClientMessageCardProps {
	onRemoveSection: () => void;
}

const ClientMessageCard = ({ onRemoveSection }: ClientMessageCardProps) => {
	const { register, formState: { isDirty, isSubmitting } } = useFormContext<UpdateQuoteClientMessageForm>();

	return (
		<div className="rounded-xl px-2 border bg-background">
			<div className="py-4 px-2 flex items-center justify-between">
				<h3 className="text-lg font-medium">Client Message</h3>
				<Button variant="ghost" size="sm" className="h-7 text-xs" onClick={onRemoveSection} disabled={isSubmitting}>
					<X className="h-3 w-3 mr-1" />
					Remove
				</Button>
			</div>
			<div className="px-2 pb-4 space-y-3">
				<Textarea
					placeholder="Add a message for the client..."
					{...register("clientMessage")}
					rows={6}
					className="resize-none"
					disabled={isSubmitting}
				/>
				{isDirty && (
					<div className="flex justify-end">
						<Button type="submit" size="sm" disabled={isSubmitting}>
							{isSubmitting && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
							Save
						</Button>
					</div>
				)}
			</div>
		</div>
	);
};

export default ClientMessageCard;
