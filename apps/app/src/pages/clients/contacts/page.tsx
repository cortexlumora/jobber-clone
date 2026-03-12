import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { getClientById, getClientContacts } from "../api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Search, ChevronLeft, ChevronRight } from "lucide-react";

const ClientContactsPage = () => {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const [page, setPage] = useState(1);
	const [search, setSearch] = useState("");
	const limit = 20;

	const { data: client } = useQuery({
		queryKey: ["client", id],
		queryFn: () => getClientById(id!),
		enabled: !!id,
	});

	const { data: result, isLoading } = useQuery({
		queryKey: ["client-contacts", id, page, limit, search],
		queryFn: () => getClientContacts(id!, page, limit, search),
		enabled: !!id,
	});

	const contacts = result?.data ?? [];
	const pagination = result?.pagination;
	const totalPages = pagination?.totalPages ?? 1;

	const displayName = client
		? client.useCompanyAsPrimary && client.companyName
			? client.companyName
			: `${client.firstName} ${client.lastName}`
		: "";

	return (
		<div className="max-w-5xl mx-auto">
			<div className="flex items-center gap-3 mb-6">
				<Button variant="ghost" size="icon" onClick={() => navigate(`/clients/${id}`)}>
					<ArrowLeft className="h-4 w-4" />
				</Button>
				<div>
					<h2 className="text-2xl font-semibold">Contacts</h2>
					{displayName && (
						<p className="text-sm text-muted-foreground">{displayName}</p>
					)}
				</div>
			</div>

			<div className="flex items-center justify-between mb-4">
				<span className="text-sm text-muted-foreground">
					{pagination ? `${pagination.total} contact${pagination.total !== 1 ? "s" : ""}` : ""}
				</span>
				<div className="relative">
					<Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
					<Input
						placeholder="Search contacts..."
						className="pl-8 h-9 w-64"
						value={search}
						onChange={(e) => {
							setSearch(e.target.value);
							setPage(1);
						}}
					/>
				</div>
			</div>

			{isLoading && <p className="text-muted-foreground">Loading...</p>}

			{!isLoading && contacts.length === 0 && (
				<p className="text-sm text-muted-foreground">No contacts found</p>
			)}

			{contacts.length > 0 && (
				<div className="rounded-lg border">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Name</TableHead>
								<TableHead>Role</TableHead>
								<TableHead>Phone</TableHead>
								<TableHead>Email</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{contacts.map((contact) => (
								<TableRow key={contact.id}>
									<TableCell>
										{contact.title !== "none" ? `${contact.title} ` : ""}
										{contact.firstName} {contact.lastName}
									</TableCell>
									<TableCell>{contact.role ?? "—"}</TableCell>
									<TableCell>{contact.phone ?? "—"}</TableCell>
									<TableCell>{contact.email ?? "—"}</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>
			)}

			{totalPages > 1 && (
				<div className="flex items-center justify-between mt-4">
					<p className="text-sm text-muted-foreground">
						Page {page} of {totalPages}
					</p>
					<div className="flex items-center gap-2">
						<Button
							variant="outline"
							size="sm"
							disabled={page <= 1}
							onClick={() => setPage((p) => p - 1)}
						>
							<ChevronLeft className="h-4 w-4" />
							Previous
						</Button>
						<Button
							variant="outline"
							size="sm"
							disabled={page >= totalPages}
							onClick={() => setPage((p) => p + 1)}
						>
							Next
							<ChevronRight className="h-4 w-4" />
						</Button>
					</div>
				</div>
			)}
		</div>
	);
};

export default ClientContactsPage;
