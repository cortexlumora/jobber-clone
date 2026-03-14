import { useQuery } from "@tanstack/react-query";
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
				<span className="text-[11px] text-muted-foreground ml-auto">
					{formatDate(note.createdAt)}, {formatTime(note.createdAt)}
				</span>
			</div>
			<p className="text-sm text-muted-foreground leading-relaxed">{note.content}</p>
		</div>
	);
}

interface NotesPanelProps {
	clientId: string | undefined;
	className?: string;
}

const NotesPanel = ({ clientId, className }: NotesPanelProps) => {
	const { data: notes = [] } = useQuery({
		queryKey: ["client-notes", clientId],
		queryFn: () => getClientNotes(clientId!),
		enabled: !!clientId,
	});

	return (
		<div className={`rounded-lg border bg-background p-4 flex flex-col ${className ?? ""}`}>
			<h3 className="text-base font-semibold mb-3">
				Notes{notes.length > 0 && ` (${notes.length})`}
			</h3>
			{notes.length === 0 ? (
				<p className="text-sm text-muted-foreground py-4">No notes yet</p>
			) : (
				<div className="divide-y overflow-y-auto flex-1 min-h-0">
					{notes.map((note) => (
						<NoteItem key={note.id} note={note} />
					))}
				</div>
			)}
		</div>
	);
};

export default NotesPanel;
