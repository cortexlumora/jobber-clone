import { useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { updateQuoteIntroSchema, type UpdateQuoteIntroForm } from "@repo/zod/quote";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateQuoteIntro } from "../../../api";
import IntroCard, { type IntroImage } from "../intro-card";

interface IntroWithMutationProps {
	quoteId: string;
	initialTitle: string;
	initialDescription: string;
	initialImage: IntroImage | null;
	onRemoveSection: () => void;
}

const IntroWithMutation = ({ quoteId, initialTitle, initialDescription, initialImage, onRemoveSection }: IntroWithMutationProps) => {
	const queryClient = useQueryClient();
	const hasContent = !!(initialTitle || initialDescription || initialImage);
	const [isEdit, setIsEdit] = useState(!hasContent);

	const form = useForm<UpdateQuoteIntroForm>({
		resolver: zodResolver(updateQuoteIntroSchema),
		defaultValues: {
			title: initialTitle,
			description: initialDescription,
			imageFileId: initialImage?.fileId ?? null,
		},
	});

	const mutation = useMutation({
		mutationFn: (data: UpdateQuoteIntroForm) => updateQuoteIntro(quoteId, data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["quote", quoteId] });
			form.reset(form.getValues());
			setIsEdit(false);
		},
	});

	return (
		<FormProvider {...form}>
			<form onSubmit={form.handleSubmit((data) => mutation.mutateAsync(data))}>
				<IntroCard
					isEdit={isEdit}
					onEdit={() => setIsEdit(true)}
					onCancelEdit={() => { form.reset(); setIsEdit(false); }}
					onRemoveSection={onRemoveSection}
					initialImage={initialImage}
				/>
			</form>
		</FormProvider>
	);
};

export default IntroWithMutation;
