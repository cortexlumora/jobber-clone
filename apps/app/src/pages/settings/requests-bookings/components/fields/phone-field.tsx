import { Input } from "@/components/ui/input";
import type { FieldRendererProps } from "./types";

export function PhoneField(_props: FieldRendererProps) {
	return (
		<>
			<Input placeholder="(___) ___-____" disabled />
			<p className="text-xs text-muted-foreground">
				By providing your phone number, you agree to receive Visit Reminders and other
				transactional text messages (SMS). You can unsubscribe at anytime by replying STOP.
				Message and data rates may apply. Message frequency varies. Reply HELP for help or
				STOP to cancel.
			</p>
			<label className="flex items-start gap-2 mt-2">
				<input type="checkbox" disabled className="size-4 mt-0.5 shrink-0" />
				<span className="text-xs text-muted-foreground">
					I also agree to receive marketing SMS from Pool Gen X. Reply STOP MKT to opt out of marketing SMS.
				</span>
			</label>
		</>
	);
}
