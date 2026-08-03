import { useEffect, useState } from "react";
import monitoBailando from "#/assets/monito-bailando.gif";

const TRIGGER_WORD = "poker";
const VISIBLE_MS = 4000;

/**
 * Global easter egg: type "poker" anywhere on the page (no need to focus
 * anything) and the dancing monkey pops up at a random spot for a few
 * seconds. Mounted once in the root layout so it works on every route.
 */
export function PokerEasterEgg() {
	const [position, setPosition] = useState<{ top: string; left: string } | null>(
		null,
	);

	useEffect(() => {
		let buffer = "";
		function handleKeyDown(event: KeyboardEvent) {
			// Single printable characters only — modifiers, arrows, Enter, etc.
			// all have a `key` longer than 1 and would otherwise pollute the
			// rolling buffer without ever matching.
			if (event.key.length !== 1) return;
			buffer = (buffer + event.key.toLowerCase()).slice(-TRIGGER_WORD.length);
			if (buffer === TRIGGER_WORD) {
				buffer = "";
				setPosition({
					top: `${Math.random() * 70 + 5}vh`,
					left: `${Math.random() * 70 + 5}vw`,
				});
			}
		}
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, []);

	useEffect(() => {
		if (!position) return;
		const timeout = setTimeout(() => setPosition(null), VISIBLE_MS);
		return () => clearTimeout(timeout);
	}, [position]);

	if (!position) return null;

	return (
		<img
			src={monitoBailando}
			alt=""
			aria-hidden
			className="rise-in pointer-events-none fixed z-50 w-36 drop-shadow-xl"
			style={{ top: position.top, left: position.left }}
		/>
	);
}
