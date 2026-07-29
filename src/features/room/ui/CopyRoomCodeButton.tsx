import { useState } from "react";

const COPIED_RESET_MS = 2000;

/** Copies the room code to the clipboard, showing a transient "¡Copiado!" ack. */
export function CopyRoomCodeButton({ code }: { code: string }) {
	const [copied, setCopied] = useState(false);

	async function handleCopy() {
		try {
			await navigator.clipboard.writeText(code);
			setCopied(true);
			setTimeout(() => setCopied(false), COPIED_RESET_MS);
		} catch {
			// Clipboard API unavailable or permission denied — nothing more we
			// can do; the code is still shown on screen to copy by hand.
		}
	}

	return (
		<button type="button" onClick={handleCopy} className="btn btn-secondary">
			{copied ? "¡Copiado!" : "Copiar código"}
		</button>
	);
}
