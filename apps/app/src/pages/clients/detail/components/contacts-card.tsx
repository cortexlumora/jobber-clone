import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getClientContacts } from "../../api";
import { Button } from "@/components/ui/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { ChevronLeft, ChevronRight } from "lucide-react";

const PAGE_SIZE = 10;

interface ContactsCardProps {
	clientId: string;
}

const ContactsCard = ({ clientId }: ContactsCardProps) => {
	const [page, setPage] = useState(1);

	const { data } = useQuery({
		queryKey: ["client-contacts", clientId, page],
		queryFn: () => getClientContacts(clientId, page, PAGE_SIZE),
		staleTime: 30_000,
		placeholderData: p=>p
	});

	const contacts = data?.data ?? [];
	const total = data?.pagination?.total ?? 0;
	const totalPages = Math.ceil(total / PAGE_SIZE);

	return (
		<div className="rounded-xl px-2 border bg-background">
			<div className="py-4 px-2">
				<h3 className="text-lg font-medium">
					Contacts{total > 0 && ` (${total})`}
				</h3>
			</div>
			{contacts.length === 0 ? (
				<p className="text-sm text-muted-foreground px-5 pb-4">No contacts found</p>
			) : (
				<>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead className="text-muted-foreground">Name</TableHead>
								<TableHead className="text-muted-foreground">Role</TableHead>
								<TableHead className="text-muted-foreground">Phone</TableHead>
								<TableHead className="text-muted-foreground">Email</TableHead>
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
					{totalPages > 1 && (
						<div className="flex items-center justify-between px-4 py-3 border-t">
							<p className="text-xs text-muted-foreground">
								{(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}
							</p>
							<div className="flex items-center gap-1">
								<Button
									variant="ghost"
									size="icon"
									className="h-7 w-7"
									disabled={page <= 1}
									onClick={() => setPage((p) => p - 1)}
								>
									<ChevronLeft className="h-4 w-4" />
								</Button>
								<Button
									variant="ghost"
									size="icon"
									className="h-7 w-7"
									disabled={page >= totalPages}
									onClick={() => setPage((p) => p + 1)}
								>
									<ChevronRight className="h-4 w-4" />
								</Button>
							</div>
						</div>
					)}
				</>
			)}
		</div>
	);
};

export default ContactsCard;
