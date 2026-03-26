import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDate, formatCurrency } from "@/lib/format";
import { sendEmail } from "@/lib/api";
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
import { FileText, Paperclip } from "lucide-react";

interface SendEmailDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	quoteId: string;
	quoteNumber: string | null;
	clientName: string;
	clientEmail: string | null;
	total: number;
	companyName?: string;
	companyEmail?: string;
}

const SendEmailDialog = ({
	open,
	onOpenChange,
	quoteId,
	quoteNumber,
	clientName,
	clientEmail,
	total,
	companyName = "Pool Gen X",
	companyEmail = "jgo@poolgenx.com",
}: SendEmailDialogProps) => {
	const today = formatDate(new Date());
	const queryClient = useQueryClient();
	const [to, setTo] = useState(clientEmail ?? "");
	const [subject, setSubject] = useState(`Quote from ${companyName} - ${today}`);
	const [message, setMessage] = useState(
		`Hi ${clientName},\n\nThank you for asking us to quote on your project.\n\nThe quote total is ${formatCurrency(total)} as of ${today}.\n\nIf you have any questions or concerns regarding this quote, please don't hesitate to get in touch with us at ${companyEmail}.\n\nSincerely,\n\n${companyName}`,
	);
	const [sendMeCopy, setSendMeCopy] = useState(false);

	const mutation = useMutation({
		mutationFn: () =>
			sendEmail({
				resourceType: "quote",
				resourceId: quoteId,
				to,
				subject,
				message,
				sendCopyToSelf: sendMeCopy,
			}),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["quote", quoteId] });
			onOpenChange(false);
		},
	});

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className=" min-w-4xl max-w-6xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>
						Email quote #{quoteNumber ?? "—"} to {clientName}
					</DialogTitle>
				</DialogHeader>

				<div className="grid grid-cols-[1fr_300px] gap-6 py-4">
					{/* Left — Email Content */}
					<div className="space-y-5">
						<div className="space-y-2">
							<Label>To</Label>
							<Input
								value={to}
								onChange={(e) => setTo(e.target.value)}
								placeholder="client@email.com"
							/>
						</div>

						<div className="space-y-2">
							<Label>Subject</Label>
							<Input
								value={subject}
								onChange={(e) => setSubject(e.target.value)}
							/>
						</div>

						<div className="space-y-2">
							<Label>Message</Label>
							<Textarea
								value={message}
								onChange={(e) => setMessage(e.target.value)}
								rows={12}
								className="resize-none"
							/>
							<p className="text-sm text-muted-foreground">
								Your client will see a button to view the schedule and location of their upcoming appointments in their Client Hub
							</p>
						</div>

						<label className="flex items-center gap-2 cursor-pointer">
							<Checkbox
								checked={sendMeCopy}
								onCheckedChange={(checked) => setSendMeCopy(!!checked)}
							/>
							<span className="text-sm text-muted-foreground">
								Send me a copy
							</span>
						</label>
					</div>

					{/* Right — Attachments */}
					<div className="space-y-5">
						<div>
							<h4 className="text-sm font-semibold mb-3">Attachments</h4>

							<div className="rounded-lg border border-dashed p-4 text-center mb-3">
								<Paperclip className="h-5 w-5 text-muted-foreground mx-auto mb-1" />
								<p className="text-sm text-muted-foreground">
									Select or drag and drop a file
								</p>
							</div>

							<div className="rounded-lg border bg-muted/30 p-3 space-y-3">
								{/* Quote PDF */}
								<div className="flex items-center gap-3 rounded-md border bg-background px-3 py-2.5">
									<div className="h-9 w-9 rounded bg-red-100 flex items-center justify-center shrink-0">
										<FileText className="h-4 w-4 text-red-600" />
									</div>
									<div className="flex-1 min-w-0">
										<p className="text-sm font-medium truncate">
											quote_{quoteNumber ?? "draft"}.pdf
										</p>
										<p className="text-xs text-muted-foreground">0 Bytes</p>
									</div>
								</div>
							</div>
						</div>

						<p className="text-xs text-muted-foreground text-center">
							You've attached 0.00 MB of the 10.00 MB limit.
						</p>
					</div>
				</div>

				{mutation.isError && (
					<p className="text-sm text-destructive">
						{mutation.error instanceof Error ? mutation.error.message : "Failed to send email"}
					</p>
				)}

				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>
						Cancel
					</Button>
					<Button onClick={() => mutation.mutate()} disabled={mutation.isPending || !to}>
						{mutation.isPending ? "Sending..." : "Send Email"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

export default SendEmailDialog;
