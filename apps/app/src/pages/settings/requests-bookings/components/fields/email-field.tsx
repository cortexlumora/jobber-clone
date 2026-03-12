import { Input } from "@/components/ui/input";
import type { FieldRendererProps } from "./types";

export function EmailField(_props: FieldRendererProps) {
	return <Input type="email" placeholder="Email" disabled />;
}
