import type { ComponentProps } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

type Title = "none" | "Mr." | "Ms." | "Mrs." | "Miss." | "Dr.";

interface PersonNameFieldsProps {
	title: Title;
	onTitleChange: (value: Title) => void;
	firstNameProps: ComponentProps<typeof Input>;
	lastNameProps: ComponentProps<typeof Input>;
	errors?: {
		firstName?: string;
		lastName?: string;
	};
}

export function PersonNameFields({
	title,
	onTitleChange,
	firstNameProps,
	lastNameProps,
	errors,
}: PersonNameFieldsProps) {
	return (
		<div className="grid grid-cols-[120px_1fr_1fr] gap-4">
			<div className="space-y-2">
				<Label>Title</Label>
				<Select onValueChange={onTitleChange} value={title}>
					<SelectTrigger>
						<SelectValue placeholder="Title" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="none">None</SelectItem>
						<SelectItem value="Mr.">Mr.</SelectItem>
						<SelectItem value="Ms.">Ms.</SelectItem>
						<SelectItem value="Mrs.">Mrs.</SelectItem>
						<SelectItem value="Miss.">Miss.</SelectItem>
						<SelectItem value="Dr.">Dr.</SelectItem>
					</SelectContent>
				</Select>
			</div>
			<div className="space-y-2">
				<Label>First Name</Label>
				<Input placeholder="John" {...firstNameProps} />
				{errors?.firstName && (
					<p className="text-sm text-destructive">{errors.firstName}</p>
				)}
			</div>
			<div className="space-y-2">
				<Label>Last Name</Label>
				<Input placeholder="Smith" {...lastNameProps} />
				{errors?.lastName && (
					<p className="text-sm text-destructive">{errors.lastName}</p>
				)}
			</div>
		</div>
	);
}
