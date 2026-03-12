import { Input } from "@/components/ui/input";
import type { FieldRendererProps } from "./types";

export function DateField(_props: FieldRendererProps) {
	return <Input type="date" disabled />;
}
