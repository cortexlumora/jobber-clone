import { useParams, useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { getRequestForms } from "../api";

const FormDetailPage = () => {
	const { formId } = useParams();
	const navigate = useNavigate();

	const { data: forms = [] } = useQuery({
		queryKey: ["request-forms"],
		queryFn: getRequestForms,
	});

	const form = forms.find((f) => f.id === formId);

	return (
		<div className="max-w-3xl">
			<div className="flex items-center gap-3 mb-6">
				<Button variant="ghost" size="sm" onClick={() => navigate("/settings/requests-bookings")}>
					<ArrowLeft className="size-4" />
				</Button>
				<h2 className="text-2xl font-semibold">{form?.name ?? "Form Details"}</h2>
			</div>
			{form?.description && (
				<p className="text-sm text-muted-foreground mb-6">{form.description}</p>
			)}
			<p className="text-muted-foreground">Coming soon</p>
		</div>
	);
};

export default FormDetailPage;
