import { Button } from "@/components/ui/button";
import type { FieldRendererProps } from "./types";

export function ImageUploadField(_props: FieldRendererProps) {
	return (
		<div className="rounded-lg border-2 border-dashed p-8 flex flex-col items-center gap-2">
			<Button variant="outline" size="sm" disabled>Select Images</Button>
			<p className="text-sm text-muted-foreground">Select or drag a file here to upload</p>
			<p className="text-xs text-muted-foreground">Up to 50MB each</p>
		</div>
	);
}
