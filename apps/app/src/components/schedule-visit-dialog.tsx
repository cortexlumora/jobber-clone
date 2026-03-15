import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from "@/components/ui/dialog";

interface ScheduleVisitDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	assignedTo?: string | null;
}

const ScheduleVisitDialog = ({ open, onOpenChange, assignedTo }: ScheduleVisitDialogProps) => {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-lg">
				<DialogHeader>
					<DialogTitle>Schedule a Visit</DialogTitle>
				</DialogHeader>
				<div className="space-y-5 py-4">
					{/* Visit Title */}
					<div className="space-y-2">
						<Label>Visit title</Label>
						<Input placeholder="e.g. Initial inspection" />
					</div>

					{/* Instructions */}
					<div className="space-y-2">
						<Label>Instructions</Label>
						<Textarea placeholder="Add visit instructions..." rows={3} />
					</div>

					{/* Visit Schedule */}
					<div className="space-y-3">
						<h4 className="text-sm font-semibold">Visit schedule</h4>
						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label>Start date</Label>
								<Input type="date" />
							</div>
							<div className="space-y-2">
								<Label>End date</Label>
								<Input type="date" />
							</div>
						</div>
						<div className="flex items-center gap-2">
							<Checkbox id="scheduleLater" />
							<Label htmlFor="scheduleLater" className="font-normal">Schedule later</Label>
						</div>
						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label>Start time</Label>
								<Input type="time" />
							</div>
							<div className="space-y-2">
								<Label>End time</Label>
								<Input type="time" />
							</div>
						</div>
						<div className="flex items-center gap-2">
							<Checkbox id="anytime" />
							<Label htmlFor="anytime" className="font-normal">Any time</Label>
						</div>
					</div>

					{/* Team */}
					<div className="space-y-2">
						<Label>Assigned to</Label>
						<Input placeholder="Select team member" value={assignedTo ?? ""} readOnly />
					</div>
				</div>
				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						Cancel
					</Button>
					<Button onClick={() => onOpenChange(false)}>
						Schedule Visit
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

export default ScheduleVisitDialog;
