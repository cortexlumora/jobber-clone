import { Button } from "@/components/ui/button";
import { ImageIcon, X } from "lucide-react";

interface ImagesCardProps {
	onRemove: () => void;
}

const ImagesCard = ({ onRemove }: ImagesCardProps) => {
	return (
		<div className="rounded-xl px-2 border bg-background">
			<div className="py-4 px-2 flex items-center justify-between">
				<h3 className="text-lg font-medium">Images</h3>
				<Button variant="ghost" size="sm" className="h-7 text-xs" onClick={onRemove}>
					<X className="h-3 w-3 mr-1" />
					Remove
				</Button>
			</div>
			<div className="px-2 pb-4 space-y-4">
				<div className="h-32 w-full rounded-lg border border-dashed bg-muted/30 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-muted/50 transition-colors">
					<ImageIcon className="h-6 w-6 text-muted-foreground" />
					<p className="text-sm text-muted-foreground">Select or drag and drop images</p>
				</div>
			</div>
		</div>
	);
};

export default ImagesCard;
