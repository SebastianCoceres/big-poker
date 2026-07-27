import { useState } from "react";

const COPIED_RESET_MS = 2000;

export function RoomCodeChip({ code }: { code: string }) {
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
		<div className="panel rise-in flex items-center justify-between gap-3">
			<div>
				<p className="kicker mb-1">Código de sala</p>
				<p className="text-ink text-xl font-bold tracking-[0.2em]">{code}</p>
			</div>
			<button type="button" onClick={handleCopy} className="btn btn-secondary">
				{copied ? "¡Copiado!" : "Copiar código"}
			</button>
		</div>
	);
}
