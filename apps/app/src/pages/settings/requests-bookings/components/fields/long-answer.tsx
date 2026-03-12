import { Textarea } from "@/components/ui/textarea";
import type { FieldRendererProps } from "./types";

export function LongAnswerField(_props: FieldRendererProps) {
	return <Textarea placeholder="" disabled rows={4} />;
}
