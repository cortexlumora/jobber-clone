import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";

const clients = [
	{ id: 1, name: "John Smith", email: "john@example.com", phone: "(555) 123-4567", status: "Active" },
	{ id: 2, name: "Jane Doe", email: "jane@example.com", phone: "(555) 234-5678", status: "Active" },
	{ id: 3, name: "Bob Johnson", email: "bob@example.com", phone: "(555) 345-6789", status: "Inactive" },
	{ id: 4, name: "Alice Williams", email: "alice@example.com", phone: "(555) 456-7890", status: "Active" },
	{ id: 5, name: "Charlie Brown", email: "charlie@example.com", phone: "(555) 567-8901", status: "Lead" },
];

const ClientsPage = () => {
	return (
		<div>
			<h2 className="text-2xl font-semibold mb-4">Clients</h2>
			<div className="rounded-lg border">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Name</TableHead>
						<TableHead>Email</TableHead>
						<TableHead>Phone</TableHead>
						<TableHead>Status</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{clients.map((client) => (
						<TableRow key={client.id}>
							<TableCell className="font-medium">{client.name}</TableCell>
							<TableCell>{client.email}</TableCell>
							<TableCell>{client.phone}</TableCell>
							<TableCell>{client.status}</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
			</div>
		</div>
	);
};

export default ClientsPage;
