import { Link } from "@tanstack/react-router";
import ThemeToggle from "./ThemeToggle";

// No bar: just the logo (doubling as the Home link) and the theme toggle,
// loose at the top of the page — no border/background/sticky.
export default function Header() {
	return (
		<header className="page-wrap flex items-center justify-between px-4 pt-4">
			<Link
				to="/"
				className="border-chip-line bg-chip text-ink inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm no-underline shadow-lg shadow-blue-950/10 sm:px-4 sm:py-2"
			>
				<span className="from-blue to-violet h-2 w-2 rounded-full bg-linear-to-r" />
				BigPoker
			</Link>
			<ThemeToggle />
		</header>
	);
}
