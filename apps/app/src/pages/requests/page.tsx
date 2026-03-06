import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

const RequestsPage = () => {
	const navigate = useNavigate();

	return (
		<div>
			<div className="flex items-center justify-between mb-4">
				<h2 className="text-2xl font-semibold">Requests</h2>
				<Button onClick={() => navigate("/requests/create")}>
					<Plus className="h-4 w-4 mr-1" />
					New Request
				</Button>
			</div>
			<p className="text-muted-foreground">No requests yet</p>
		</div>
	);
};

export default RequestsPage;
