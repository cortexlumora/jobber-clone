import type { ClientNoteDTO } from "@repo/dto";
import { formatDate, formatTime, getInitials } from "@/lib/format";
import { Pin } from "lucide-react";
import { Button } from "@/components/ui/button";

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
	notes: ClientNoteDTO[];
	total?: number;
	hasMore?: boolean;
	onLoadMore?: () => void;
	isLoadingMore?: boolean;
	className?: string;
}

const NotesPanel = ({ notes, total, hasMore, onLoadMore, isLoadingMore, className }: NotesPanelProps) => {
	const count = total ?? notes.length;

	return (
		<div className={`rounded-lg border bg-background p-4 flex flex-col ${className ?? ""}`}>
			<h3 className="text-base font-semibold mb-3">Notes{count > 0 && ` (${count})`}</h3>
			{notes.length === 0 ? (
				<p className="text-sm text-muted-foreground py-4">No notes yet</p>
			) : (
				<div className="divide-y overflow-y-auto flex-1 min-h-0">
					{notes.map((note) => (
						<NoteItem key={note.id} note={note} />
					))}

					{hasMore && (
						<div className="w-full justify-center items-center h-16 shrink-0 flex">

						<Button variant="link" size="sm" className="mt-2 text-xs" onClick={onLoadMore} disabled={isLoadingMore}>
							{isLoadingMore ? "Loading..." : "Load more"}
						</Button>
						</div>
					)}
				</div>
			)}
		</div>
	);
};

export default NotesPanel;
