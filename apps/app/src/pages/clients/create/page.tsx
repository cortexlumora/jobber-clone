import { useRef } from "react";
import { useNavigate } from "react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { CreateClientForm } from "@repo/zod/client";
import { createClient } from "@/lib/api";
import { StickyFooter } from "@/components/sticky-footer";
import { Button } from "@/components/ui/button";
import ClientForm from "../components/client-form";

const CreateClientPage = () => {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const createAnotherRef = useRef(false);
	const resetRef = useRef<(() => void) | null>(null);

	const mutation = useMutation({
		mutationFn: createClient,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["clients"] });
			if (createAnotherRef.current) {
				resetRef.current?.();
				createAnotherRef.current = false;
			} else {
				navigate("/clients");
			}
		},
	});

	const handleSubmit = (data: CreateClientForm) => {
		createAnotherRef.current = false;
		mutation.mutate(data);
	};

	const handleSubmitAndCreateAnother = () => {
		createAnotherRef.current = true;
		document.getElementById("client-form")?.dispatchEvent(
			new Event("submit", { cancelable: true, bubbles: true })
		);
	};

	return (
		<StickyFooter.Root>
			<StickyFooter.Content className="max-w-5xl mx-auto">
				<h2 className="text-2xl font-semibold mt-8 mb-8">Create Client</h2>
				<ClientForm
					onSubmit={handleSubmit}
					onReset={(fn) => { resetRef.current = fn; }}
					error={mutation.isError ? mutation.error.message : null}
				/>
			</StickyFooter.Content>
			<StickyFooter.Bar
				className="max-w-5xl"
				left={
					<Button variant="outline" onClick={() => navigate("/clients")}>
						Cancel
					</Button>
				}
				right={
					<>
						<Button variant="outline" disabled={mutation.isPending} onClick={handleSubmitAndCreateAnother}>
							Save & Create Another
						</Button>
						<Button disabled={mutation.isPending} type="submit" form="client-form">
							{mutation.isPending ? "Saving..." : "Save Client"}
						</Button>
					</>
				}
			/>
		</StickyFooter.Root>
	);
};

export default CreateClientPage;
