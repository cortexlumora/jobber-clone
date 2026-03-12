import { useParams, useNavigate } from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { CreateClientForm } from "@repo/zod/client";
import { getClientById, getClientProperties, getClientContacts, updateClient } from "../api";
import { StickyFooter } from "@/components/sticky-footer";
import { Button } from "@/components/ui/button";
import ClientForm from "../components/client-form";

const EditClientPage = () => {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const queryClient = useQueryClient();

	const { data: client, isLoading: clientLoading } = useQuery({
		queryKey: ["client", id],
		queryFn: () => getClientById(id!),
		enabled: !!id,
	});

	const { data: propertiesResult, isLoading: propsLoading } = useQuery({
		queryKey: ["client-properties", id],
		queryFn: () => getClientProperties(id!, 1, 100),
		enabled: !!id,
	});
	const properties = propertiesResult?.data ?? [];

	const { data: contactsResult, isLoading: contactsLoading } = useQuery({
		queryKey: ["client-contacts", id],
		queryFn: () => getClientContacts(id!),
		enabled: !!id,
	});
	const contacts = contactsResult?.data ?? [];

	const mutation = useMutation({
		mutationFn: (data: CreateClientForm) => updateClient(id!, data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["clients"] });
			queryClient.invalidateQueries({ queryKey: ["client", id] });
			queryClient.invalidateQueries({ queryKey: ["client-properties", id] });
			queryClient.invalidateQueries({ queryKey: ["client-contacts", id] });
			navigate(`/clients/${id}`);
		},
	});

	if (clientLoading || propsLoading || contactsLoading) {
		return <p className="text-muted-foreground p-4">Loading...</p>;
	}

	if (!client) {
		return <p className="text-muted-foreground p-4">Client not found</p>;
	}

	const defaultValues: Partial<CreateClientForm> = {
		title: client.title,
		firstName: client.firstName,
		lastName: client.lastName,
		companyName: client.companyName ?? undefined,
		useCompanyAsPrimary: client.useCompanyAsPrimary,
		leadSource: client.leadSource ?? undefined,
		phones: client.phones,
		emails: client.emails,
		notifications: client.notifications,
		properties: properties.length > 0
			? properties.map((p) => ({
				address: {
					street1: p.street1 ?? undefined,
					street2: p.street2 ?? undefined,
					city: p.city ?? undefined,
					state: p.state ?? undefined,
					zip: p.zip ?? undefined,
					country: p.country ?? undefined,
				},
				billingSameAsProperty: p.billingSameAsProperty,
				billingAddress: p.billingSameAsProperty ? undefined : {
					street1: p.billingStreet1 ?? undefined,
					street2: p.billingStreet2 ?? undefined,
					city: p.billingCity ?? undefined,
					state: p.billingState ?? undefined,
					zip: p.billingZip ?? undefined,
					country: p.billingCountry ?? undefined,
				},
			}))
			: [{ address: {}, billingSameAsProperty: true }],
	};

	const initialContacts = {
		additional: contacts.map((c) => ({
			title: c.title,
			firstName: c.firstName,
			lastName: c.lastName,
			role: c.role ?? "",
			phone: c.phone ?? "",
			email: c.email ?? "",
			notifications: c.notifications,
		})),
		property: [] as { title: "none" | "Mr." | "Ms." | "Mrs." | "Miss." | "Dr."; firstName: string; lastName: string; role: string; phone: string; email: string; notifications: { quoteFollowUp: boolean; invoiceFollowUp: boolean; appointmentReminders: boolean; jobFollowUp: boolean } }[],
	};

	return (
		<StickyFooter.Root>
			<StickyFooter.Content className="max-w-5xl mx-auto">
				<h2 className="text-2xl font-semibold mt-8 mb-8">Edit Client</h2>
				<ClientForm
					defaultValues={defaultValues}
					initialContacts={initialContacts}
					onSubmit={(data) => mutation.mutate(data)}
					error={mutation.isError ? mutation.error.message : null}
				/>
			</StickyFooter.Content>
			<StickyFooter.Bar
				className="max-w-5xl"
				left={
					<Button variant="outline" onClick={() => navigate(`/clients/${id}`)}>
						Cancel
					</Button>
				}
				right={
					<Button disabled={mutation.isPending} type="submit" form="client-form">
						{mutation.isPending ? "Saving..." : "Save Client"}
					</Button>
				}
			/>
		</StickyFooter.Root>
	);
};

export default EditClientPage;
