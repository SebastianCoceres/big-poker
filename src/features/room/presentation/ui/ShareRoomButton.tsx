import { useState } from "react";
import { Button } from "#/shared/ui/Button";

const COPIED_RESET_MS = 2000;

/**
 * Shares the room's join link (`/room/{code}`, which already renders the
 * join form for anyone without a saved identity) via the native share
 * sheet, falling back to a clipboard copy on browsers without Web Share.
 */
export function ShareRoomButton({ code }: { code: string }) {
	const [copied, setCopied] = useState(false);

	async function handleShare() {
		const url = `${window.location.origin}/room/${code}`;

		if (navigator.share) {
			try {
				await navigator.share({
					title: "Unite a la sala de Planning Poker",
					text: `Código de sala: ${code}`,
					url,
				});
			} catch {
				// User dismissed the share sheet — nothing more to do.
			}
			return;
		}

		try {
			await navigator.clipboard.writeText(url);
			setCopied(true);
			setTimeout(() => setCopied(false), COPIED_RESET_MS);
		} catch {
			// Clipboard API unavailable or permission denied.
		}
	}

	return (
		<Button onClick={handleShare}>
			{copied ? "¡Copiado!" : "Compartir"}
		</Button>
	);
}
