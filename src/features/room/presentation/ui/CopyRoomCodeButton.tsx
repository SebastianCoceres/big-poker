import { IconCheck, IconCopy } from "@tabler/icons-react";
import { useState } from "react";

const COPIED_RESET_MS = 2000;

/** Icon-only button that copies the room code to the clipboard, swapping to a check for a moment as ack. */
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
		<button
			type="button"
			onClick={handleCopy}
			aria-label={copied ? "Código copiado" : "Copiar código"}
			className="text-blue-deep hover:bg-surface-strong active:bg-surface-strong rounded-full p-2.5 transition"
		>
			{copied ? (
				<IconCheck className="h-4 w-4" aria-hidden="true" />
			) : (
				<IconCopy className="h-4 w-4" aria-hidden="true" />
			)}
		</button>
	);
}
