import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { getClients, getClientProperties } from "@/pages/clients/api";
import type { ClientDTO, PropertyDTO } from "@repo/dto";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Phone, Mail, MapPin } from "lucide-react";

const statusColors: Record<string, string> = {
	lead: "bg-purple-100 text-purple-700",
	active: "bg-green-100 text-green-700",
	inactive: "bg-gray-100 text-gray-700",
};

function formatRelativeTime(date: Date) {
	const now = new Date();
	const d = new Date(date);
	const diffMs = now.getTime() - d.getTime();
	const diffMin = Math.floor(diffMs / 60000);
	const diffHours = Math.floor(diffMs / 3600000);
	const diffDays = Math.floor(diffMs / 86400000);

	if (diffMin < 1) return "Just now";
	if (diffMin < 60) return `${diffMin} minute${diffMin === 1 ? "" : "s"} ago`;
	if (diffHours < 24) return `about ${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
	if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
	return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const InvoiceClientSelectPage = () => {
	const navigate = useNavigate();
	const [search, setSearch] = useState("");

	const { data: clients } = useQuery({
		queryKey: ["clients"],
		queryFn: getClients,
	});

	const clientIds = useMemo(() => {
		if (!clients) return [];
		return clients.map((c) => c.id);
	}, [clients]);

	const { data: propertiesMap } = useQuery({
		queryKey: ["invoice-client-properties", clientIds],
		queryFn: async () => {
			const map = new Map<string, PropertyDTO[]>();
			await Promise.all(
				clientIds.map(async (clientId) => {
					const result = await getClientProperties(clientId, 1, 100);
					map.set(clientId, result.data);
				}),
			);
			return map;
		},
		enabled: clientIds.length > 0,
	});

	const getClientDisplayName = (client: ClientDTO) => {
		const title = client.title !== "none" ? `${client.title} ` : "";
		if (client.useCompanyAsPrimary && client.companyName) {
			return { name: client.companyName, subtitle: `${title}${client.firstName} ${client.lastName}` };
		}
		return { name: `${title}${client.firstName} ${client.lastName}`, subtitle: client.companyName };
	};

	const filteredClients = useMemo(() => {
		if (!clients) return [];
		if (!search.trim()) return clients;
		const q = search.toLowerCase();
		return clients.filter((client) => {
			const { name, subtitle } = getClientDisplayName(client);
			return (
				name.toLowerCase().includes(q) ||
				(subtitle && subtitle.toLowerCase().includes(q)) ||
				client.phones.some((p) => p.number.includes(q)) ||
				client.emails.some((e) => e.value.toLowerCase().includes(q))
			);
		});
	}, [clients, search]);

	// Group by status
	const grouped = useMemo(() => {
		const groups: Record<string, ClientDTO[]> = {};
		for (const client of filteredClients) {
			const status = client.status === "lead" ? "Leads" : client.status === "active" ? "Active" : "Inactive";
			if (!groups[status]) groups[status] = [];
			groups[status].push(client);
		}
		return groups;
	}, [filteredClients]);

	const handleSelect = (clientId: string) => {
		navigate(`/invoices/create?clientId=${clientId}`);
	};

	return (
		<div className="max-w-2xl mx-auto">
			<h2 className="text-2xl font-semibold mb-2">New Invoice</h2>
			<p className="text-muted-foreground mb-6">Which client would you like to create this invoice for?</p>

			<div className="relative mb-4">
				<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
				<Input
					placeholder="Search clients..."
					className="pl-9"
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					autoFocus
				/>
			</div>

			<div className="mb-6">
				<Button variant="outline" className="w-full justify-start" onClick={() => navigate("/clients/create")}>
					<Plus className="h-4 w-4 mr-2" />
					Create New Client
				</Button>
			</div>

			<div className="space-y-6">
				{Object.entries(grouped).map(([status, groupClients]) => (
					<div key={status}>
						<h3 className="text-sm font-medium text-muted-foreground mb-2">{status}</h3>
						<div className="space-y-1">
							{groupClients.map((client) => {
								const { name, subtitle } = getClientDisplayName(client);
								const properties = propertiesMap?.get(client.id) ?? [];
								const phone = client.phones[0]?.number;
								const email = client.emails[0]?.value;

								return (
									<div
										key={client.id}
										className="rounded-lg border px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors"
										onClick={() => handleSelect(client.id)}
									>
										<div className="flex items-start justify-between">
											<div className="flex-1 min-w-0">
												<div className="flex items-center gap-2">
													<span className="font-medium">
														{subtitle && <span className="text-muted-foreground">{name}</span>}
														{!subtitle && name}
													</span>
													{subtitle && <span className="text-sm text-muted-foreground">({subtitle})</span>}
													{client.status !== "inactive" && (
														<Badge variant="secondary" className={statusColors[client.status]}>
															{client.status.charAt(0).toUpperCase() + client.status.slice(1)}
														</Badge>
													)}
												</div>
												<div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
													<span className="flex items-center gap-1">
														<MapPin className="h-3 w-3" />
														{properties.length} Propert{properties.length === 1 ? "y" : "ies"}
													</span>
													{phone && (
														<span className="flex items-center gap-1">
															<Phone className="h-3 w-3" />
															{phone}
														</span>
													)}
													{email && (
														<span className="flex items-center gap-1">
															<Mail className="h-3 w-3" />
															{email}
														</span>
													)}
												</div>
												<p className="text-xs text-muted-foreground mt-1">
													Activity {formatRelativeTime(client.updatedAt)}
												</p>
											</div>
										</div>
										{client.tags && client.tags.length > 0 && (
											<div className="flex gap-1.5 mt-2">
												{client.tags.map((tag) => (
													<Badge
														key={tag.id}
														variant="outline"
														className="text-xs"
														style={tag.color ? { borderColor: tag.color, color: tag.color } : undefined}
													>
														{tag.name}
													</Badge>
												))}
											</div>
										)}
									</div>
								);
							})}
						</div>
					</div>
				))}

				{filteredClients.length === 0 && (
					<p className="text-sm text-muted-foreground text-center py-8">No clients found</p>
				)}
			</div>
		</div>
	);
};

export default InvoiceClientSelectPage;
