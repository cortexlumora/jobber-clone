import { useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { updateQuoteClientMessageSchema, type UpdateQuoteClientMessageForm } from "@repo/zod/quote";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateQuoteClientMessage } from "../../../api";
import ClientMessageCard from "../client-message-card";

interface ClientMessageWithMutationProps {
	quoteId: string;
	initialMessage: string;
	onRemoveSection: () => void;
}

const ClientMessageWithMutation = ({ quoteId, initialMessage, onRemoveSection }: ClientMessageWithMutationProps) => {
	const queryClient = useQueryClient();
	const [isEdit, setIsEdit] = useState(!initialMessage);

	const form = useForm<UpdateQuoteClientMessageForm>({
		resolver: zodResolver(updateQuoteClientMessageSchema),
		defaultValues: { clientMessage: initialMessage },
	});

	const mutation = useMutation({
		mutationFn: (data: UpdateQuoteClientMessageForm) => updateQuoteClientMessage(quoteId, data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["quote", quoteId] });
			form.reset(form.getValues());
			setIsEdit(false);
		},
	});

	return (
		<FormProvider {...form}>
			<form onSubmit={form.handleSubmit((data) => mutation.mutateAsync(data))}>
				<ClientMessageCard isEdit={isEdit} onEdit={() => setIsEdit(true)} onCancelEdit={() => { form.reset(); setIsEdit(false); }} onRemoveSection={onRemoveSection} />
			</form>
		</FormProvider>
	);
};

export default ClientMessageWithMutation;
