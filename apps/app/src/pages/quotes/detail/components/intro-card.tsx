import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ImageIcon, X } from "lucide-react";

interface IntroCardProps {
	onRemove: () => void;
}

const IntroCard = ({ onRemove }: IntroCardProps) => {
	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");

	return (
		<div className="rounded-xl px-2 border bg-background">
			<div className="py-4 px-2 flex items-center justify-between">
				<h3 className="text-lg font-medium">Introduction</h3>
				<Button variant="ghost" size="sm" className="h-7 text-xs" onClick={onRemove}>
					<X className="h-3 w-3 mr-1" />
					Remove
				</Button>
			</div>
			<div className="px-2 pb-4 space-y-4">
				<div className="h-32 w-full rounded-lg border border-dashed bg-muted/30 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-muted/50 transition-colors">
					<ImageIcon className="h-6 w-6 text-muted-foreground" />
					<p className="text-sm text-muted-foreground">Add cover image</p>
				</div>

				<Input
					placeholder="Title"
					value={title}
					onChange={(e) => setTitle(e.target.value)}
				/>

				<Textarea
					placeholder="Description"
					value={description}
					onChange={(e) => setDescription(e.target.value)}
					rows={4}
					className="resize-none"
				/>
			</div>
		</div>
	);
};

export default IntroCard;
