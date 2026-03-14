import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getClientProperties } from "../../api";
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

interface PropertiesCardProps {
	clientId: string;
}

const PropertiesCard = ({ clientId }: PropertiesCardProps) => {
	const [page, setPage] = useState(1);

	const { data } = useQuery({
		queryKey: ["client-properties", clientId, page],
		queryFn: () => getClientProperties(clientId, page, PAGE_SIZE),
	});

	const properties = data?.data ?? [];
	const total = data?.pagination?.total ?? 0;
	const totalPages = Math.ceil(total / PAGE_SIZE);

	return (
		<div className="rounded-xl px-2 border bg-background">
			<div className="py-4 px-2">
				<h3 className="text-lg font-medium">
					Properties{total > 0 && ` (${total})`}
				</h3>
			</div>
			{properties.length === 0 ? (
				<p className="text-sm text-muted-foreground px-5 pb-4">No properties</p>
			) : (
				<>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead className="text-muted-foreground">Address</TableHead>
								<TableHead className="text-muted-foreground">City</TableHead>
								<TableHead className="text-muted-foreground">State</TableHead>
								<TableHead className="text-muted-foreground">ZIP</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{properties.map((prop) => (
								<TableRow key={prop.id}>
									<TableCell>
										{[prop.street1, prop.street2].filter(Boolean).join(", ") || "—"}
									</TableCell>
									<TableCell>{prop.city ?? "—"}</TableCell>
									<TableCell>{prop.state ?? "—"}</TableCell>
									<TableCell>{prop.zip ?? "—"}</TableCell>
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

export default PropertiesCard;
