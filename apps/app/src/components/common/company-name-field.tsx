import type { ComponentProps } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

interface CompanyNameFieldProps {
	inputProps: ComponentProps<typeof Input>;
	useAsPrimary: boolean;
	onUseAsPrimaryChange: (checked: boolean) => void;
}

export function CompanyNameField({
	inputProps,
	useAsPrimary,
	onUseAsPrimaryChange,
}: CompanyNameFieldProps) {
	return (
		<>
			<div className="space-y-2">
				<Label>Company Name</Label>
				<Input placeholder="Acme Inc." {...inputProps} />
			</div>
			<div className="flex items-center gap-2">
				<Checkbox
					id="useCompanyAsPrimary"
					checked={useAsPrimary}
					onCheckedChange={(v) => onUseAsPrimaryChange(v === true)}
				/>
				<Label htmlFor="useCompanyAsPrimary" className="font-normal">
					Use company name as the primary name
				</Label>
			</div>
		</>
	);
}
