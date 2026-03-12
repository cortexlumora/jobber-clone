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
		</>
	);
}
