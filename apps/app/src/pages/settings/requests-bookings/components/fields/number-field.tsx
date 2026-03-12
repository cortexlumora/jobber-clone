import { Input } from "@/components/ui/input";
import type { FieldRendererProps } from "./types";

export function NumberField(_props: FieldRendererProps) {
	return <Input type="number" placeholder="0" disabled />;
}
