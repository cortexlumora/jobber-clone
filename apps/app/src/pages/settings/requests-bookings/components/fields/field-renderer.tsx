import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { FieldRendererProps } from "./types";
import { NameGroupField } from "./name-group";
import { CompanyNameField } from "./company-name";
import { EmailField } from "./email-field";
import { PhoneField } from "./phone-field";
import { AddressField } from "./address-field";
import { ShortAnswerField } from "./short-answer";
import { LongAnswerField } from "./long-answer";
import { ImageUploadField } from "./image-upload";
import { LeadSourceField } from "./lead-source";
import { DropdownSingleField } from "./dropdown-single";
import { DropdownMultiField } from "./dropdown-multi";
import { CheckboxField } from "./checkbox-field";
import { RadioField } from "./radio-field";
import { NumberField } from "./number-field";
import { YesNoField } from "./yes-no";
import { DateField } from "./date-field";
import { AreaField } from "./area-field";
import { ProductsServicesField } from "./products-services";

export function FieldRenderer(props: FieldRendererProps) {
	switch (props.field.type) {
		case "name_group":
			return <NameGroupField {...props} />;
		case "company_name":
			return <CompanyNameField {...props} />;
		case "email":
			return <EmailField {...props} />;
		case "phone":
			return <PhoneField {...props} />;
		case "address":
			return <AddressField {...props} />;
		case "short_answer":
			return <ShortAnswerField {...props} />;
		case "long_answer":
			return <LongAnswerField {...props} />;
		case "image_upload":
			return <ImageUploadField {...props} />;
		case "lead_source":
			return <LeadSourceField {...props} />;
		case "dropdown_single":
			return <DropdownSingleField {...props} />;
		case "dropdown_multi":
			return <DropdownMultiField {...props} />;
		case "checkbox":
			return <CheckboxField {...props} />;
		case "radio":
			return <RadioField {...props} />;
		case "number":
			return <NumberField {...props} />;
		case "yes_no":
			return <YesNoField {...props} />;
		case "date":
			return <DateField {...props} />;
		case "area":
			return <AreaField {...props} />;
		case "products_services":
			return <ProductsServicesField {...props} />;
		default:
			return (
				<div className="space-y-2">
					<Label>{props.field.label}</Label>
					<Input placeholder="" disabled />
				</div>
			);
	}
}
