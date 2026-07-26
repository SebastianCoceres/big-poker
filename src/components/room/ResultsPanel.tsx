import type { RoomSnapshot } from "#/server/rooms.server";

export function ResultsPanel({ snapshot }: { snapshot: RoomSnapshot }) {
	if (!snapshot.results) return null;
	const { average, blocked, voteCount } = snapshot.results;

	return (
		<div className="demo-panel rise-in flex flex-col items-center gap-3 py-8 text-center">
			<p className="island-kicker">Resultado</p>
			<h2 className="demo-muted max-w-lg text-base font-semibold">
				{snapshot.question}
			</h2>
			{blocked ? (
				<p
					className="demo-alert rise-in text-sm"
					style={{ animationDelay: "120ms" }}
				>
					Hay votos de discusión (?/☕) — no se calcula un promedio. Charlá con
					el equipo y volvé a votar. Mirá la carta de cada uno en su avatar,
					abajo.
				</p>
			) : average !== null ? (
				<div
					className="rise-in flex flex-col items-center gap-1"
					style={{ animationDelay: "120ms" }}
				>
					<span className="display-title text-6xl font-bold leading-none text-[var(--lagoon-deep)] sm:text-7xl">
						{average}
					</span>
					<span className="demo-muted text-sm">
						Media estimada, redondeada hacia arriba · {voteCount} voto
						{voteCount === 1 ? "" : "s"}
					</span>
				</div>
			) : (
				<p className="demo-muted text-sm">Nadie votó todavía en esta ronda.</p>
			)}
		</div>
	);
}
