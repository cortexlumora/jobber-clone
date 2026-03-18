import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateQuoteFiles } from "../../api";
import type { QuoteFileDTO } from "@repo/dto";
import AttachmentsCard, { type AttachmentFile } from "./attachments-card";

interface AttachmentsCardWithMutationProps {
	quoteId: string;
	initialFiles: QuoteFileDTO[];
	onRemoveSection: () => void;
}

const AttachmentsCardWithMutation = ({ quoteId, initialFiles, onRemoveSection }: AttachmentsCardWithMutationProps) => {
	const queryClient = useQueryClient();
	const [files, setFiles] = useState<AttachmentFile[]>(() =>
		initialFiles.map((f) => ({ fileId: f.id, name: f.name })),
	);

	const mutation = useMutation({
		mutationFn: (data: { addedFileIds: string[]; removedFileIds: string[] }) =>
			updateQuoteFiles(quoteId, { category: "attachment", ...data }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["quote", quoteId] });
		},
	});

	const handleAdd = (newFiles: AttachmentFile[]) => {
		setFiles((prev) => [...prev, ...newFiles]);
		mutation.mutate({
			addedFileIds: newFiles.map((f) => f.fileId),
			removedFileIds: [],
		});
	};

	const handleRemoveFile = (fileId: string) => {
		setFiles((prev) => prev.filter((f) => f.fileId !== fileId));
		mutation.mutate({
			addedFileIds: [],
			removedFileIds: [fileId],
		});
	};

	return (
		<AttachmentsCard
			files={files}
			onAdd={handleAdd}
			onRemoveFile={handleRemoveFile}
			onRemoveSection={onRemoveSection}
			saving={mutation.isPending}
		/>
	);
};

export default AttachmentsCardWithMutation;
