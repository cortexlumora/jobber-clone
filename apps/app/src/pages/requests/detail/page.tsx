import { useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { getRequestById } from "../api";
import { getClientNotes } from "@/pages/clients/api";
import type { ClientNoteDTO } from "@repo/dto";
import { Pin } from "lucide-react";

function formatDate(date: Date | string) {
	const d = new Date(date);
	return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatTime(date: Date | string) {
	const d = new Date(date);
	return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function getInitials(name: string) {
	return name
		.split(" ")
		.map((n) => n[0])
		.join("")
		.slice(0, 2)
		.toUpperCase();
}

function NoteItem({ note }: { note: ClientNoteDTO }) {
	return (
		<div className={`py-3 ${note.isPinned ? "border-l-2 border-l-primary pl-3" : ""}`}>
			<div className="flex items-center gap-2 mb-1">
				<div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-medium">
					{getInitials(note.createdByName)}
				</div>
				<span className="text-xs font-medium">{note.createdByName}</span>
				{note.isPinned && <Pin className="h-3 w-3 text-primary fill-primary" />}
				<span className="text-[11px] text-muted-foreground ml-auto">{formatDate(note.createdAt)}, {formatTime(note.createdAt)}</span>
			</div>
			<p className="text-sm text-muted-foreground leading-relaxed">{note.content}</p>
		</div>
	);
}

const RequestDetailPage = () => {
	const { id } = useParams<{ id: string }>();

	const { data: request, isLoading } = useQuery({
		queryKey: ["request", id],
		queryFn: () => getRequestById(id!),
		enabled: !!id,
	});

	const { data: notes = [] } = useQuery({
		queryKey: ["client-notes", request?.clientId],
		queryFn: () => getClientNotes(request!.clientId),
		enabled: !!request?.clientId,
	});

	if (isLoading) {
		return <p className="text-muted-foreground p-4">Loading...</p>;
	}

	if (!request) {
		return <p className="text-muted-foreground p-4">Request not found</p>;
	}

	return (
		<div className="max-w-7xl mx-auto">
			<div className="mb-6">
				<h2 className="text-2xl font-semibold">{request.title}</h2>
			</div>

			<div className="grid grid-cols-[1fr_30%] gap-6">
				{/* Left - Main Content (70%) */}
				<div className="space-y-6">
					{/* Placeholder for future content */}
				</div>

				{/* Right - Notes (30%) */}
				<div className="rounded-lg border bg-background p-4">
					<h3 className="text-base font-semibold mb-3">
						Notes{notes.length > 0 && ` (${notes.length})`}
					</h3>
					{notes.length === 0 ? (
						<p className="text-sm text-muted-foreground py-4">No notes yet</p>
					) : (
						<div className="divide-y">
							{notes.map((note) => (
								<NoteItem key={note.id} note={note} />
							))}
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default RequestDetailPage;
