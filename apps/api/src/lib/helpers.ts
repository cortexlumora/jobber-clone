import type { Context } from "hono";

export function getUserIdFromCTX(c: Context): string {
	// TODO: integrate auth (Clerk, etc.)
	return "e7bc3263-02ad-4e71-b71b-41be465694e4";
}
