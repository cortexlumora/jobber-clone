import { Input } from "@/components/ui/input";
import type { FieldRendererProps } from "./types";

export function CompanyNameField(_props: FieldRendererProps) {
	return <Input placeholder="Company name" disabled />;
}
