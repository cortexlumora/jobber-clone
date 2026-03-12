import { useParams } from "react-router";

const RequestDetailPage = () => {
	const { id } = useParams();

	return (
		<div>
			<h2 className="text-2xl font-semibold mb-8">Request Detail</h2>
			<p className="text-muted-foreground">Request ID: {id}</p>
		</div>
	);
};

export default RequestDetailPage;
