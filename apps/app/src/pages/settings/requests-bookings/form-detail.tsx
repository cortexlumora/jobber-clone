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
		<div className="min-h-screen flex flex-col">
			{/* Header bar */}
			<header className="h-14 border-b flex items-center justify-between px-4 shrink-0">
				<div className="flex items-center gap-3">
					<Button variant="ghost" size="sm" onClick={() => navigate("/settings/requests-bookings")}>
						<ArrowLeft className="size-4" />
					</Button>
					<h1 className="text-lg font-semibold">{form?.name ?? "Form Details"}</h1>
				</div>
				<div className="flex items-center gap-2">
					<Button variant="outline" size="sm" onClick={() => navigate("/settings/requests-bookings")}>
						Cancel
					</Button>
					<Button size="sm">Save</Button>
				</div>
			</header>

			{/* Canvas area */}
			<div className="flex-1 p-8">
				{form?.description && (
					<p className="text-sm text-muted-foreground mb-6">{form.description}</p>
				)}
				<p className="text-muted-foreground">Coming soon</p>
			</div>
		</div>
	);
};

export default FormDetailPage;
