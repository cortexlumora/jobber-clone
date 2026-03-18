import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {  X } from "lucide-react";

interface ClientMessageCardProps {
	onRemove: () => void;
}

const ClientMessageCard = ({ onRemove }: ClientMessageCardProps) => {
	const [message, setMessage] = useState("");

	return (
		<div className="rounded-xl px-2 border bg-background">
			<div className="py-4 px-2 flex items-center justify-between">
				<h3 className="text-lg font-medium">Client Message</h3>
				<Button variant="ghost" size="sm" className="h-7 text-xs" onClick={onRemove}>
					<X className="h-3 w-3 mr-1" />
					Remove
				</Button>
			</div>
			<div className="px-2 pb-4 space-y-4">
				<Textarea
					placeholder="Add a message for the client..."
					value={message}
					onChange={(e) => setMessage(e.target.value)}
					rows={6}
					className="resize-none"
				/>
			</div>
		</div>
	);
};

export default ClientMessageCard;
