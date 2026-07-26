import { Link } from "@tanstack/react-router";
import ThemeToggle from "./ThemeToggle";

// No bar: just the logo (doubling as the Home link) and the theme toggle,
// loose at the top of the page — no border/background/sticky.
export default function Header() {
	return (
		<header className="page-wrap flex items-center justify-between px-4 pt-4">
			<Link
				to="/"
				className="inline-flex items-center gap-2 rounded-full border border-[var(--chip-line)] bg-[var(--chip-bg)] px-3 py-1.5 text-sm text-[var(--sea-ink)] no-underline shadow-[0_8px_24px_rgba(30,90,72,0.08)] sm:px-4 sm:py-2"
			>
				<span className="h-2 w-2 rounded-full bg-[linear-gradient(90deg,#56c6be,#7ed3bf)]" />
				BigPoker
			</Link>
			<ThemeToggle />
		</header>
	);
}
