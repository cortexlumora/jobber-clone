import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { FieldRendererProps } from "./types";

export function ImageUploadField({ field }: FieldRendererProps) {
	return (
		<div className="space-y-2">
			<Label>{field.label}</Label>
			<div className="rounded-lg border-2 border-dashed p-8 flex flex-col items-center gap-2">
				<Button variant="outline" size="sm" disabled>Select Images</Button>
				<p className="text-sm text-muted-foreground">Select or drag a file here to upload</p>
				<p className="text-xs text-muted-foreground">Up to 50MB each</p>
			</div>
		</div>
	);
}
