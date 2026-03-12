import { Button } from "@/components/ui/button";
import type { FieldRendererProps } from "./types";

export function YesNoField(_props: FieldRendererProps) {
	return (
		<div className="flex items-center gap-3">
			<Button variant="outline" size="sm" disabled>Yes</Button>
			<Button variant="outline" size="sm" disabled>No</Button>
		</div>
	);
}
