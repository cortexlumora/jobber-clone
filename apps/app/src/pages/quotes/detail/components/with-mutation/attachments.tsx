import { useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateQuoteFiles } from "../../../api";
import type { QuoteFileDTO } from "@repo/dto";
import AttachmentsCard, { type AttachmentFile } from "../attachments-card";

interface AttachmentsCardWithMutationProps {
	quoteId: string;
	initialFiles: QuoteFileDTO[];
	onRemoveSection: () => void;
}

const AttachmentsCardWithMutation = ({ quoteId, initialFiles, onRemoveSection }: AttachmentsCardWithMutationProps) => {
	const queryClient = useQueryClient();
	const [isEdit, setIsEdit] = useState(initialFiles.length === 0);
	const [files, setFiles] = useState<AttachmentFile[]>(() =>
		initialFiles.map((f) => ({ fileId: f.id, name: f.name })),
	);
	const addedFileIds = useRef<string[]>([]);
	const removedFileIds = useRef<string[]>([]);
	const isDirty = addedFileIds.current.length > 0 || removedFileIds.current.length > 0;

	const mutation = useMutation({
		mutationFn: () =>
			updateQuoteFiles(quoteId, {
				category: "attachment",
				addedFileIds: addedFileIds.current,
				removedFileIds: removedFileIds.current,
			}),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["quote", quoteId] });
			addedFileIds.current = [];
			removedFileIds.current = [];
			setIsEdit(false);
		},
	});

	const handleAdd = (newFiles: AttachmentFile[]) => {
		setFiles((prev) => [...prev, ...newFiles]);
		addedFileIds.current.push(...newFiles.map((f) => f.fileId));
	};

	const handleRemoveFile = (fileId: string) => {
		setFiles((prev) => prev.filter((f) => f.fileId !== fileId));
		if (addedFileIds.current.includes(fileId)) {
			addedFileIds.current = addedFileIds.current.filter((id) => id !== fileId);
		} else {
			removedFileIds.current.push(fileId);
		}
	};

	const handleCancel = () => {
		setFiles(initialFiles.map((f) => ({ fileId: f.id, name: f.name })));
		addedFileIds.current = [];
		removedFileIds.current = [];
		setIsEdit(false);
	};

	return (
		<AttachmentsCard
			isEdit={isEdit}
			isDirty={isDirty}
			onEdit={() => setIsEdit(true)}
			onCancelEdit={handleCancel}
			onSave={() => mutation.mutate()}
			onRemoveSection={onRemoveSection}
			files={files}
			onAdd={handleAdd}
			onRemoveFile={handleRemoveFile}
			saving={mutation.isPending}
		/>
	);
};

export default AttachmentsCardWithMutation;
